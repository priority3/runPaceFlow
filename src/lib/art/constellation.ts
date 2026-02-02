/**
 * Route Constellation Algorithm
 *
 * Transforms running routes into star constellation patterns
 */

import { getPaceZoneColor, hexToRgba } from './colors'

/**
 * Star data for constellation
 */
export interface Star {
  x: number
  y: number
  size: number
  brightness: number
  color: string
  kilometer: number
  pace: number
  isSpecial: boolean // Start/end points
  twinklePhase: number
}

/**
 * Connection line between stars
 */
export interface StarConnection {
  from: { x: number; y: number }
  to: { x: number; y: number }
  brightness: number
  color: string
}

/**
 * Constellation generation options
 */
export interface ConstellationOptions {
  averagePace: number
  baseStarSize: number
  showConnections: boolean
  starDensity: number // Points per kilometer
}

/**
 * Generate stars from kilometer markers
 * @param kmMarkers Kilometer marker data
 * @param canvasWidth Canvas width
 * @param canvasHeight Canvas height
 * @param bounds Route bounds
 * @param options Generation options
 * @returns Array of stars
 */
export function generateStars(
  kmMarkers: Array<{
    coordinate: { longitude: number; latitude: number }
    kilometer: number
    pace: number
  }>,
  canvasWidth: number,
  canvasHeight: number,
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
  options: ConstellationOptions,
): Star[] {
  if (kmMarkers.length === 0) return []

  const { averagePace, baseStarSize } = options
  const { minLng, maxLng, minLat, maxLat } = bounds
  const lngRange = maxLng - minLng || 1
  const latRange = maxLat - minLat || 1

  // Add padding
  const padding = 60
  const drawWidth = canvasWidth - padding * 2
  const drawHeight = canvasHeight - padding * 2

  // Calculate pace range for size mapping
  const paces = kmMarkers.map((m) => m.pace)
  const minPace = Math.min(...paces)
  const maxPace = Math.max(...paces)
  const paceRange = maxPace - minPace || 1

  const stars: Star[] = []

  for (let i = 0; i < kmMarkers.length; i++) {
    const marker = kmMarkers[i]
    const { longitude, latitude } = marker.coordinate

    // Convert to canvas coordinates
    const x = padding + ((longitude - minLng) / lngRange) * drawWidth
    const y = padding + ((maxLat - latitude) / latRange) * drawHeight // Flip Y axis

    // Calculate star size based on pace performance (faster = bigger)
    const paceNormalized = 1 - (marker.pace - minPace) / paceRange
    const size = baseStarSize * (0.5 + paceNormalized * 1.5)

    // Calculate brightness based on pace
    const brightness = 0.5 + paceNormalized * 0.5

    // Get color based on pace
    const color = getPaceZoneColor(marker.pace, averagePace)

    // Mark first and last as special
    const isSpecial = i === 0 || i === kmMarkers.length - 1

    stars.push({
      x,
      y,
      size: isSpecial ? size * 1.5 : size,
      brightness,
      color,
      kilometer: marker.kilometer,
      pace: marker.pace,
      isSpecial,
      twinklePhase: Math.random() * Math.PI * 2,
    })
  }

  return stars
}

/**
 * Generate connections between stars
 * @param stars Array of stars
 * @param averagePace Average pace for color calculation
 * @returns Array of connections
 */
export function generateConnections(stars: Star[], averagePace: number): StarConnection[] {
  if (stars.length < 2) return []

  const connections: StarConnection[] = []

  for (let i = 0; i < stars.length - 1; i++) {
    const from = stars[i]
    const to = stars[i + 1]

    // Average pace between two points
    const avgPace = (from.pace + to.pace) / 2
    const color = getPaceZoneColor(avgPace, averagePace)

    // Brightness based on pace
    const brightness = avgPace < averagePace ? 0.6 : 0.3

    connections.push({
      from: { x: from.x, y: from.y },
      to: { x: to.x, y: to.y },
      brightness,
      color,
    })
  }

  return connections
}

/**
 * Draw constellation on canvas
 * @param ctx Canvas 2D context
 * @param stars Array of stars
 * @param connections Array of connections
 * @param showLabels Whether to show kilometer labels
 * @param twinkleTime Current time for twinkle animation
 */
export function drawConstellation(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  connections: StarConnection[],
  showLabels: boolean,
  twinkleTime = 0,
): void {
  // Draw connections first (behind stars)
  for (const connection of connections) {
    ctx.beginPath()
    ctx.moveTo(connection.from.x, connection.from.y)
    ctx.lineTo(connection.to.x, connection.to.y)
    ctx.strokeStyle = hexToRgba(connection.color, connection.brightness * 0.5)
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Draw stars
  for (const star of stars) {
    // Calculate twinkle effect
    const twinkle = star.isSpecial ? 1 : 0.7 + 0.3 * Math.sin(twinkleTime * 2 + star.twinklePhase)
    const currentBrightness = star.brightness * twinkle

    // Draw glow
    const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3)
    gradient.addColorStop(0, hexToRgba(star.color, currentBrightness * 0.5))
    gradient.addColorStop(0.5, hexToRgba(star.color, currentBrightness * 0.2))
    gradient.addColorStop(1, hexToRgba(star.color, 0))

    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw star core
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fillStyle = hexToRgba('#FFFFFF', currentBrightness)
    ctx.fill()

    // Draw special star effects (start/end)
    if (star.isSpecial) {
      drawNebulaEffect(ctx, star.x, star.y, star.size * 4, star.color, currentBrightness * 0.3)
    }

    // Draw labels
    if (showLabels) {
      ctx.font = '12px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = hexToRgba('#FFFFFF', 0.7)
      ctx.textAlign = 'center'
      ctx.fillText(`${star.kilometer}km`, star.x, star.y + star.size + 16)
    }
  }
}

/**
 * Draw nebula effect for special stars
 */
function drawNebulaEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number,
): void {
  // Create multiple overlapping gradients for nebula effect
  for (let i = 0; i < 3; i++) {
    const offsetX = (Math.random() - 0.5) * radius * 0.5
    const offsetY = (Math.random() - 0.5) * radius * 0.5

    const gradient = ctx.createRadialGradient(
      x + offsetX,
      y + offsetY,
      0,
      x + offsetX,
      y + offsetY,
      radius,
    )
    gradient.addColorStop(0, hexToRgba(color, alpha))
    gradient.addColorStop(0.5, hexToRgba(color, alpha * 0.3))
    gradient.addColorStop(1, hexToRgba(color, 0))

    ctx.beginPath()
    ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }
}

/**
 * Generate background stars for atmosphere
 * @param canvasWidth Canvas width
 * @param canvasHeight Canvas height
 * @param count Number of background stars
 * @returns Array of background star positions
 */
export function generateBackgroundStars(
  canvasWidth: number,
  canvasHeight: number,
  count: number,
): Array<{ x: number; y: number; size: number; brightness: number }> {
  const stars: Array<{ x: number; y: number; size: number; brightness: number }> = []

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      size: Math.random() * 1.5 + 0.5,
      brightness: Math.random() * 0.5 + 0.2,
    })
  }

  return stars
}

/**
 * Draw background stars
 * @param ctx Canvas 2D context
 * @param stars Background star data
 * @param twinkleTime Time for twinkle animation
 */
export function drawBackgroundStars(
  ctx: CanvasRenderingContext2D,
  stars: Array<{ x: number; y: number; size: number; brightness: number }>,
  twinkleTime = 0,
): void {
  for (const [i, star] of stars.entries()) {
    const twinkle = 0.5 + 0.5 * Math.sin(twinkleTime * 3 + i * 0.5)
    const brightness = star.brightness * twinkle

    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fillStyle = hexToRgba('#FFFFFF', brightness)
    ctx.fill()
  }
}
