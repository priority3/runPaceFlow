/**
 * Running Fingerprint Algorithm
 *
 * Generates a continuous spiral visualization from running data
 * Inspired by Strava Year in Sport - one continuous line that spirals outward
 * Color and thickness change smoothly along the path based on pace
 */

import type { ArtTheme, PremiumPalette } from './colors'
import {
  getElevationColor,
  getHeartRateColor,
  getPaceZoneColor,
  getSmoothElevationColor,
  getSmoothHeartRateColor,
  getSmoothPaceColor,
  hexToRgba,
  interpolateColor,
} from './colors'

/**
 * Split data for fingerprint generation
 */
export interface FingerprintSplit {
  kilometer: number
  pace: number // seconds per km
  duration: number // seconds
  averageHeartRate?: number
  elevation?: number
}

/**
 * Fingerprint ring data (represents spiral segment data)
 */
export interface FingerprintRing {
  kilometer: number
  innerRadius: number
  outerRadius: number
  color: string
  pace: number
  thickness: number
}

/**
 * Fingerprint generation options
 */
export interface FingerprintOptions {
  mode: 'pace' | 'heartrate' | 'elevation'
  averagePace: number
  maxHeartRate?: number
  minElevation?: number
  maxElevation?: number
  baseRadius?: number
  ringSpacing?: number
  minThickness?: number
  maxThickness?: number
  usePremiumColors?: boolean
  palette?: PremiumPalette
  minPace?: number
  maxPace?: number
}

/**
 * Premium rendering options for drawFingerprint
 */
export interface PremiumRenderOptions {
  enableGlow?: boolean
  enableDepth?: boolean
  enableHighlight?: boolean
  enableCenterGlow?: boolean
  glowIntensity?: number
  theme?: ArtTheme
}

/**
 * Generate fingerprint rings from split data
 */
export function generateFingerprintRings(
  splits: FingerprintSplit[],
  options: FingerprintOptions,
): FingerprintRing[] {
  const {
    mode,
    averagePace,
    maxHeartRate = 190,
    minElevation = 0,
    maxElevation = 100,
    baseRadius = 25,
    ringSpacing = 12, // Increased spacing for sparser spiral
    minThickness = 6,
    maxThickness = 16,
    usePremiumColors = true,
    palette = 'default',
  } = options

  const paces = splits.map((s) => s.pace)
  const minPace = options.minPace ?? Math.min(...paces)
  const maxPace = options.maxPace ?? Math.max(...paces)
  const paceRange = maxPace - minPace || 1

  const rings: FingerprintRing[] = []
  let currentRadius = baseRadius

  for (const split of splits) {
    const paceNormalized = (split.pace - minPace) / paceRange
    const thickness = minThickness + paceNormalized * (maxThickness - minThickness)

    let color: string
    switch (mode) {
      case 'heartrate': {
        if (split.averageHeartRate) {
          color = usePremiumColors
            ? getSmoothHeartRateColor(split.averageHeartRate, maxHeartRate, palette)
            : getHeartRateColor(split.averageHeartRate, maxHeartRate)
        } else {
          color = '#888888'
        }
        break
      }
      case 'elevation': {
        if (split.elevation !== undefined) {
          color = usePremiumColors
            ? getSmoothElevationColor(split.elevation, minElevation, maxElevation, palette)
            : getElevationColor(split.elevation, minElevation, maxElevation)
        } else {
          color = '#888888'
        }
        break
      }
      case 'pace':
      default: {
        color = usePremiumColors
          ? getSmoothPaceColor(split.pace, minPace, maxPace, palette)
          : getPaceZoneColor(split.pace, averagePace)
      }
    }

    rings.push({
      kilometer: split.kilometer,
      innerRadius: currentRadius,
      outerRadius: currentRadius + thickness,
      color,
      pace: split.pace,
      thickness,
    })

    currentRadius += thickness + ringSpacing
  }

  return rings
}

/**
 * Calculate radial lines for elevation visualization
 */
export function calculateRadialLines(
  elevationData: number[],
  numLines: number,
  maxRadius: number,
): Array<{ angle: number; length: number }> {
  if (elevationData.length === 0) return []

  const minElev = Math.min(...elevationData)
  const maxElev = Math.max(...elevationData)
  const elevRange = maxElev - minElev || 1

  const lines: Array<{ angle: number; length: number }> = []
  const angleStep = (Math.PI * 2) / numLines

  for (let i = 0; i < numLines; i++) {
    const dataIndex = Math.floor((i / numLines) * elevationData.length)
    const elevation = elevationData[dataIndex]
    const normalized = (elevation - minElev) / elevRange

    lines.push({
      angle: i * angleStep,
      length: 10 + normalized * (maxRadius * 0.3),
    })
  }

  return lines
}

/**
 * Draw center glow effect
 */
function drawCenterGlow(
  ctx: CanvasRenderingContext2D,
  color: string,
  radius: number,
  intensity: number,
): void {
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
  gradient.addColorStop(0, hexToRgba(color, intensity * 0.8))
  gradient.addColorStop(0.4, hexToRgba(color, intensity * 0.3))
  gradient.addColorStop(1, hexToRgba(color, 0))

  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
}

/**
 * Draw a continuous spiral with smoothly varying color and thickness
 * This creates a single unbroken line that spirals outward
 */
export function drawFingerprint(
  ctx: CanvasRenderingContext2D,
  rings: FingerprintRing[],
  centerX: number,
  centerY: number,
  rotation = 0,
  radialLines?: Array<{ angle: number; length: number }>,
  premiumOptions: PremiumRenderOptions = {},
): void {
  const { enableGlow = true, enableCenterGlow = true, glowIntensity = 0.25 } = premiumOptions

  if (rings.length === 0) return

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)

  // Draw center glow
  if (enableCenterGlow) {
    drawCenterGlow(ctx, rings[0].color, rings[0].innerRadius * 1.2, glowIntensity)
  }

  // Spiral parameters - half rotation per kilometer for sparser spiral
  const rotationsPerKm = 0.5 // Each km = half rotation (180°)
  const totalRotations = rings.length * rotationsPerKm
  const startRadius = rings[0].innerRadius
  const endRadius = rings.at(-1)!.outerRadius
  const totalAngle = totalRotations * Math.PI * 2

  // High resolution for smooth spiral
  const pointsPerRotation = 120
  const totalPoints = Math.ceil(totalRotations * pointsPerRotation)

  // Pre-calculate all points with their colors and thicknesses
  const points: Array<{
    x: number
    y: number
    color: string
    thickness: number
  }> = []

  for (let i = 0; i <= totalPoints; i++) {
    const progress = i / totalPoints
    const angle = -Math.PI / 2 + progress * totalAngle // Start from top
    const radius = startRadius + progress * (endRadius - startRadius)

    // Find which ring (kilometer) we're in and interpolate
    const kmProgress = progress * rings.length
    const ringIndex = Math.min(Math.floor(kmProgress), rings.length - 1)
    const nextRingIndex = Math.min(ringIndex + 1, rings.length - 1)
    const ringFraction = kmProgress - ringIndex

    // Interpolate color between current and next ring
    const currentRing = rings[ringIndex]
    const nextRing = rings[nextRingIndex]
    const color = interpolateColor(currentRing.color, nextRing.color, ringFraction)
    const thickness =
      currentRing.thickness + (nextRing.thickness - currentRing.thickness) * ringFraction

    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      color,
      thickness,
    })
  }

  // Draw glow layer first (thicker, semi-transparent)
  if (enableGlow) {
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]

      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.strokeStyle = hexToRgba(p1.color, glowIntensity)
      ctx.lineWidth = p1.thickness + 8
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  }

  // Draw main spiral line with gradient effect
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]

    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)

    // Create slight depth effect - lighter on inner edge
    const baseColor = p1.color
    ctx.strokeStyle = baseColor
    ctx.lineWidth = p1.thickness
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  // Draw inner highlight (thin white line along inner edge)
  ctx.globalAlpha = 0.15
  for (let i = 0; i < points.length - 1; i += 2) {
    const progress = i / totalPoints
    const angle = -Math.PI / 2 + progress * totalAngle
    const radius = startRadius + progress * (endRadius - startRadius) - points[i].thickness * 0.35

    const x1 = Math.cos(angle) * radius
    const y1 = Math.sin(angle) * radius

    const nextProgress = (i + 2) / totalPoints
    const nextAngle = -Math.PI / 2 + nextProgress * totalAngle
    const nextRadius =
      startRadius +
      nextProgress * (endRadius - startRadius) -
      (points[i + 2]?.thickness ?? points[i].thickness) * 0.35

    const x2 = Math.cos(nextAngle) * nextRadius
    const y2 = Math.sin(nextAngle) * nextRadius

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Draw radial lines if provided
  if (radialLines && radialLines.length > 0) {
    const maxRingRadius = endRadius

    for (const line of radialLines) {
      ctx.beginPath()
      ctx.moveTo(0, 0)
      const endX = Math.cos(line.angle) * (maxRingRadius + line.length)
      const endY = Math.sin(line.angle) * (maxRingRadius + line.length)
      ctx.lineTo(endX, endY)
      ctx.strokeStyle = hexToRgba('#FFFFFF', 0.06)
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  ctx.restore()
}

/**
 * Draw fingerprint with animation
 */
export function drawFingerprintAnimated(
  ctx: CanvasRenderingContext2D,
  rings: FingerprintRing[],
  centerX: number,
  centerY: number,
  progress: number,
): void {
  if (rings.length === 0) return

  ctx.save()
  ctx.translate(centerX, centerY)

  // Draw center glow
  if (progress > 0) {
    drawCenterGlow(
      ctx,
      rings[0].color,
      rings[0].innerRadius * 1.2,
      0.25 * Math.min(progress * 2, 1),
    )
  }

  // Sparse spiral - half rotation per km
  const rotationsPerKm = 0.5
  const totalRotations = rings.length * rotationsPerKm
  const startRadius = rings[0].innerRadius
  const endRadius = rings.at(-1)!.outerRadius
  const totalAngle = totalRotations * Math.PI * 2

  const pointsPerRotation = 120
  const totalPoints = Math.floor(Math.ceil(totalRotations * pointsPerRotation) * progress)

  const points: Array<{ x: number; y: number; color: string; thickness: number }> = []

  for (let i = 0; i <= totalPoints; i++) {
    const pointProgress = i / Math.ceil(totalRotations * pointsPerRotation)
    const angle = -Math.PI / 2 + pointProgress * totalAngle
    const radius = startRadius + pointProgress * (endRadius - startRadius)

    const kmProgress = pointProgress * rings.length
    const ringIndex = Math.min(Math.floor(kmProgress), rings.length - 1)
    const nextRingIndex = Math.min(ringIndex + 1, rings.length - 1)
    const ringFraction = kmProgress - ringIndex

    const currentRing = rings[ringIndex]
    const nextRing = rings[nextRingIndex]
    const color = interpolateColor(currentRing.color, nextRing.color, ringFraction)
    const thickness =
      currentRing.thickness + (nextRing.thickness - currentRing.thickness) * ringFraction

    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      color,
      thickness,
    })
  }

  // Draw glow
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]

    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.strokeStyle = hexToRgba(p1.color, 0.25)
    ctx.lineWidth = p1.thickness + 8
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  // Draw main line
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]

    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.strokeStyle = p1.color
    ctx.lineWidth = p1.thickness
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  ctx.restore()
}

/**
 * Calculate total fingerprint radius
 */
export function calculateFingerprintRadius(rings: FingerprintRing[]): number {
  if (rings.length === 0) return 0
  const lastRing = rings.at(-1)
  return lastRing ? lastRing.outerRadius : 0
}
