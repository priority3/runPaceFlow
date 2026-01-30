/**
 * Running Fingerprint Algorithm
 *
 * Generates unique circular "fingerprint" patterns from running data
 * Each ring represents 1 kilometer with visual properties mapped to performance metrics
 */

import { getElevationColor, getHeartRateColor, getPaceZoneColor, hexToRgba } from './colors'

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
 * Fingerprint ring data
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
}

/**
 * Generate fingerprint rings from split data
 * @param splits Array of split data
 * @param options Generation options
 * @returns Array of ring data for rendering
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
    baseRadius = 50,
    ringSpacing = 8,
    minThickness = 4,
    maxThickness = 20,
  } = options

  // Calculate pace range for thickness mapping
  const paces = splits.map((s) => s.pace)
  const minPace = Math.min(...paces)
  const maxPace = Math.max(...paces)
  const paceRange = maxPace - minPace || 1

  const rings: FingerprintRing[] = []
  let currentRadius = baseRadius

  for (const split of splits) {
    // Calculate thickness based on pace (slower = thicker)
    const paceNormalized = (split.pace - minPace) / paceRange
    const thickness = minThickness + paceNormalized * (maxThickness - minThickness)

    // Determine color based on mode
    let color: string
    switch (mode) {
      case 'heartrate': {
        color = split.averageHeartRate
          ? getHeartRateColor(split.averageHeartRate, maxHeartRate)
          : '#888888'
        break
      }
      case 'elevation': {
        color =
          split.elevation !== undefined
            ? getElevationColor(split.elevation, minElevation, maxElevation)
            : '#888888'
        break
      }
      case 'pace':
      default: {
        color = getPaceZoneColor(split.pace, averagePace)
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
 * @param elevationData Array of elevation values
 * @param numLines Number of radial lines
 * @param maxRadius Maximum radius
 * @returns Array of line endpoints
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
      length: 10 + normalized * (maxRadius * 0.3), // 10-30% of max radius
    })
  }

  return lines
}

/**
 * Draw fingerprint on canvas
 * @param ctx Canvas 2D context
 * @param rings Ring data
 * @param centerX Center X coordinate
 * @param centerY Center Y coordinate
 * @param rotation Rotation angle in radians
 * @param radialLines Optional radial lines for elevation
 */
export function drawFingerprint(
  ctx: CanvasRenderingContext2D,
  rings: FingerprintRing[],
  centerX: number,
  centerY: number,
  rotation = 0,
  radialLines?: Array<{ angle: number; length: number }>,
): void {
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)

  // Draw rings
  for (const ring of rings) {
    ctx.beginPath()
    ctx.arc(0, 0, ring.innerRadius + ring.thickness / 2, 0, Math.PI * 2)
    ctx.strokeStyle = ring.color
    ctx.lineWidth = ring.thickness
    ctx.stroke()

    // Add subtle glow effect
    ctx.beginPath()
    ctx.arc(0, 0, ring.innerRadius + ring.thickness / 2, 0, Math.PI * 2)
    ctx.strokeStyle = hexToRgba(ring.color, 0.3)
    ctx.lineWidth = ring.thickness + 4
    ctx.stroke()
  }

  // Draw radial lines if provided
  if (radialLines && radialLines.length > 0) {
    const lastRing = rings.at(-1)
    const maxRingRadius = lastRing ? lastRing.outerRadius : 100

    for (const line of radialLines) {
      ctx.beginPath()
      ctx.moveTo(0, 0)
      const endX = Math.cos(line.angle) * (maxRingRadius + line.length)
      const endY = Math.sin(line.angle) * (maxRingRadius + line.length)
      ctx.lineTo(endX, endY)
      ctx.strokeStyle = hexToRgba('#FFFFFF', 0.15)
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  ctx.restore()
}

/**
 * Draw fingerprint with animation frame
 * @param ctx Canvas 2D context
 * @param rings Ring data
 * @param centerX Center X coordinate
 * @param centerY Center Y coordinate
 * @param progress Animation progress (0-1)
 */
export function drawFingerprintAnimated(
  ctx: CanvasRenderingContext2D,
  rings: FingerprintRing[],
  centerX: number,
  centerY: number,
  progress: number,
): void {
  ctx.save()
  ctx.translate(centerX, centerY)

  const visibleRings = Math.ceil(progress * rings.length)

  for (let i = 0; i < visibleRings; i++) {
    const ring = rings[i]
    const ringProgress = i === visibleRings - 1 ? (progress * rings.length) % 1 : 1

    ctx.beginPath()
    ctx.arc(0, 0, ring.innerRadius + ring.thickness / 2, 0, Math.PI * 2 * ringProgress)
    ctx.strokeStyle = ring.color
    ctx.lineWidth = ring.thickness
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  ctx.restore()
}

/**
 * Calculate total fingerprint radius
 * @param rings Ring data
 * @returns Total radius including all rings
 */
export function calculateFingerprintRadius(rings: FingerprintRing[]): number {
  if (rings.length === 0) return 0
  const lastRing = rings.at(-1)
  return lastRing ? lastRing.outerRadius : 0
}
