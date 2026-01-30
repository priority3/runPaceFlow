/**
 * Particle System for Flow Field Animation
 *
 * Creates flowing particle effects along running routes
 */

import { getPaceZoneColor, hexToRgba } from './colors'

/**
 * Single particle in the flow field
 */
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  color: string
  alpha: number
  life: number
  maxLife: number
  trail: Array<{ x: number; y: number }>
}

/**
 * Route point for flow field
 */
export interface FlowPoint {
  x: number
  y: number
  pace: number
  direction: number // angle in radians
}

/**
 * Flow field options
 */
export interface FlowFieldOptions {
  particleCount: number
  trailLength: number
  baseSpeed: number
  speedMultiplier: number
  averagePace: number
  colorByPace: boolean
  fadeRate: number
}

/**
 * Create initial particles along the route
 * @param flowPoints Route points with direction
 * @param options Flow field options
 * @returns Array of particles
 */
export function createParticles(flowPoints: FlowPoint[], options: FlowFieldOptions): Particle[] {
  const { particleCount, baseSpeed, averagePace, colorByPace } = options

  if (flowPoints.length === 0) return []

  const particles: Particle[] = []

  for (let i = 0; i < particleCount; i++) {
    // Distribute particles along the route
    const pointIndex = Math.floor(Math.random() * flowPoints.length)
    const point = flowPoints[pointIndex]

    // Calculate speed based on pace (faster pace = faster particles)
    const paceRatio = averagePace / point.pace
    const speed = baseSpeed * paceRatio

    // Determine color
    const color = colorByPace ? getPaceZoneColor(point.pace, averagePace) : '#FFFFFF'

    particles.push({
      x: point.x + (Math.random() - 0.5) * 10,
      y: point.y + (Math.random() - 0.5) * 10,
      vx: Math.cos(point.direction) * speed,
      vy: Math.sin(point.direction) * speed,
      speed,
      color,
      alpha: 0.8 + Math.random() * 0.2,
      life: Math.random() * 100,
      maxLife: 100 + Math.random() * 50,
      trail: [],
    })
  }

  return particles
}

/**
 * Update particle positions
 * @param particles Array of particles
 * @param flowPoints Route points for direction guidance
 * @param options Flow field options
 * @param deltaTime Time since last update
 */
export function updateParticles(
  particles: Particle[],
  flowPoints: FlowPoint[],
  options: FlowFieldOptions,
  deltaTime: number,
): void {
  const { trailLength, speedMultiplier, fadeRate, averagePace, colorByPace } = options

  for (const particle of particles) {
    // Store current position in trail
    particle.trail.push({ x: particle.x, y: particle.y })
    if (particle.trail.length > trailLength) {
      particle.trail.shift()
    }

    // Find nearest flow point for direction
    const nearestPoint = findNearestFlowPoint(particle.x, particle.y, flowPoints)

    if (nearestPoint) {
      // Gradually adjust velocity towards flow direction
      const targetVx = Math.cos(nearestPoint.direction) * particle.speed * speedMultiplier
      const targetVy = Math.sin(nearestPoint.direction) * particle.speed * speedMultiplier

      particle.vx += (targetVx - particle.vx) * 0.1
      particle.vy += (targetVy - particle.vy) * 0.1

      // Update color based on current position's pace
      if (colorByPace) {
        particle.color = getPaceZoneColor(nearestPoint.pace, averagePace)
      }
    }

    // Update position
    particle.x += particle.vx * deltaTime
    particle.y += particle.vy * deltaTime

    // Update life
    particle.life += deltaTime
    particle.alpha = Math.max(0, 1 - (particle.life / particle.maxLife) * fadeRate)

    // Reset particle if it's dead or too far from route
    if (particle.life > particle.maxLife || particle.alpha <= 0) {
      resetParticle(particle, flowPoints, options)
    }
  }
}

/**
 * Find nearest flow point to a position
 */
function findNearestFlowPoint(x: number, y: number, flowPoints: FlowPoint[]): FlowPoint | null {
  if (flowPoints.length === 0) return null

  let nearest = flowPoints[0]
  let minDist = Number.MAX_VALUE

  for (const point of flowPoints) {
    const dist = (point.x - x) ** 2 + (point.y - y) ** 2
    if (dist < minDist) {
      minDist = dist
      nearest = point
    }
  }

  return nearest
}

/**
 * Reset a particle to a new position on the route
 */
function resetParticle(
  particle: Particle,
  flowPoints: FlowPoint[],
  options: FlowFieldOptions,
): void {
  if (flowPoints.length === 0) return

  const pointIndex = Math.floor(Math.random() * flowPoints.length)
  const point = flowPoints[pointIndex]

  const paceRatio = options.averagePace / point.pace
  const speed = options.baseSpeed * paceRatio

  particle.x = point.x + (Math.random() - 0.5) * 10
  particle.y = point.y + (Math.random() - 0.5) * 10
  particle.vx = Math.cos(point.direction) * speed
  particle.vy = Math.sin(point.direction) * speed
  particle.speed = speed
  particle.color = options.colorByPace
    ? getPaceZoneColor(point.pace, options.averagePace)
    : '#FFFFFF'
  particle.alpha = 0.8 + Math.random() * 0.2
  particle.life = 0
  particle.maxLife = 100 + Math.random() * 50
  particle.trail = []
}

/**
 * Draw particles on canvas
 * @param ctx Canvas 2D context
 * @param particles Array of particles
 */
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const particle of particles) {
    // Draw trail
    if (particle.trail.length > 1) {
      ctx.beginPath()
      ctx.moveTo(particle.trail[0].x, particle.trail[0].y)

      for (let i = 1; i < particle.trail.length; i++) {
        ctx.lineTo(particle.trail[i].x, particle.trail[i].y)
      }

      ctx.lineTo(particle.x, particle.y)

      // Create gradient for trail
      const gradient = ctx.createLinearGradient(
        particle.trail[0].x,
        particle.trail[0].y,
        particle.x,
        particle.y,
      )
      gradient.addColorStop(0, hexToRgba(particle.color, 0))
      gradient.addColorStop(1, hexToRgba(particle.color, particle.alpha))

      ctx.strokeStyle = gradient
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    // Draw particle head
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = hexToRgba(particle.color, particle.alpha)
    ctx.fill()
  }
}

/**
 * Convert route coordinates to flow points
 * @param coordinates Array of [lng, lat] coordinates
 * @param paces Array of pace values for each segment
 * @param canvasWidth Canvas width
 * @param canvasHeight Canvas height
 * @param bounds Route bounds
 * @returns Array of flow points
 */
export function coordinatesToFlowPoints(
  coordinates: Array<[number, number]>,
  paces: number[],
  canvasWidth: number,
  canvasHeight: number,
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
): FlowPoint[] {
  if (coordinates.length < 2) return []

  const { minLng, maxLng, minLat, maxLat } = bounds
  const lngRange = maxLng - minLng || 1
  const latRange = maxLat - minLat || 1

  // Add padding
  const padding = 40
  const drawWidth = canvasWidth - padding * 2
  const drawHeight = canvasHeight - padding * 2

  const flowPoints: FlowPoint[] = []

  for (let i = 0; i < coordinates.length; i++) {
    const [lng, lat] = coordinates[i]

    // Convert to canvas coordinates
    const x = padding + ((lng - minLng) / lngRange) * drawWidth
    const y = padding + ((maxLat - lat) / latRange) * drawHeight // Flip Y axis

    // Calculate direction from this point to next
    let direction = 0
    if (i < coordinates.length - 1) {
      const [nextLng, nextLat] = coordinates[i + 1]
      const nextX = padding + ((nextLng - minLng) / lngRange) * drawWidth
      const nextY = padding + ((maxLat - nextLat) / latRange) * drawHeight
      direction = Math.atan2(nextY - y, nextX - x)
    } else if (i > 0) {
      // Use previous direction for last point
      const [prevLng, prevLat] = coordinates[i - 1]
      const prevX = padding + ((prevLng - minLng) / lngRange) * drawWidth
      const prevY = padding + ((maxLat - prevLat) / latRange) * drawHeight
      direction = Math.atan2(y - prevY, x - prevX)
    }

    // Get pace for this segment
    const paceIndex = Math.min(i, paces.length - 1)
    const pace = paces[paceIndex] || 360

    flowPoints.push({ x, y, pace, direction })
  }

  return flowPoints
}
