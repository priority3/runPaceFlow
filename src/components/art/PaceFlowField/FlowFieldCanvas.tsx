'use client'

import { useCallback, useEffect, useRef } from 'react'

import type { ArtTheme } from '@/lib/art/colors'
import { artThemes, hexToRgba } from '@/lib/art/colors'
import type { FlowFieldOptions, FlowPoint, Particle } from '@/lib/art/particles'
import {
  coordinatesToFlowPoints,
  createParticles,
  drawParticles,
  updateParticles,
} from '@/lib/art/particles'

interface FlowFieldCanvasProps {
  coordinates: Array<[number, number]>
  paces: number[]
  bounds: {
    minLng: number
    maxLng: number
    minLat: number
    maxLat: number
  }
  averagePace: number
  isPlaying: boolean
  speed: number
  particleCount: number
  trailLength: number
  colorByPace: boolean
  theme?: ArtTheme
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
  className?: string
}

/**
 * Canvas component for rendering pace flow field animation
 */
export function FlowFieldCanvas({
  coordinates,
  paces,
  bounds,
  averagePace,
  isPlaying,
  speed,
  particleCount,
  trailLength,
  colorByPace,
  theme = 'default',
  onCanvasReady,
  className = '',
}: FlowFieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const flowPointsRef = useRef<FlowPoint[]>([])
  const lastTimeRef = useRef<number>(0)
  const dimensionsRef = useRef({ width: 0, height: 0 })

  // Initialize flow points when coordinates change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || coordinates.length < 2) return

    const { width, height } = dimensionsRef.current
    if (width === 0 || height === 0) return

    flowPointsRef.current = coordinatesToFlowPoints(coordinates, paces, width, height, bounds)
  }, [coordinates, paces, bounds])

  // Initialize particles when settings change
  useEffect(() => {
    if (flowPointsRef.current.length === 0) return

    const options: FlowFieldOptions = {
      particleCount,
      trailLength,
      baseSpeed: 2,
      speedMultiplier: speed,
      averagePace,
      colorByPace,
      fadeRate: 0.5,
    }

    particlesRef.current = createParticles(flowPointsRef.current, options)
  }, [particleCount, trailLength, speed, averagePace, colorByPace])

  // Draw function
  const draw = useCallback(
    (deltaTime: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { width, height } = dimensionsRef.current
      const themeColors = artThemes[theme]

      // Semi-transparent background for trail effect
      ctx.fillStyle = hexToRgba(themeColors.background, 0.1)
      ctx.fillRect(0, 0, width, height)

      // Draw route path (faint)
      if (flowPointsRef.current.length > 1) {
        ctx.beginPath()
        ctx.moveTo(flowPointsRef.current[0].x, flowPointsRef.current[0].y)
        for (let i = 1; i < flowPointsRef.current.length; i++) {
          ctx.lineTo(flowPointsRef.current[i].x, flowPointsRef.current[i].y)
        }
        ctx.strokeStyle = hexToRgba('#FFFFFF', 0.1)
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Update and draw particles
      if (isPlaying && particlesRef.current.length > 0) {
        const options: FlowFieldOptions = {
          particleCount,
          trailLength,
          baseSpeed: 2,
          speedMultiplier: speed,
          averagePace,
          colorByPace,
          fadeRate: 0.5,
        }

        updateParticles(particlesRef.current, flowPointsRef.current, options, deltaTime)
      }

      drawParticles(ctx, particlesRef.current)
    },
    [isPlaying, particleCount, trailLength, speed, averagePace, colorByPace, theme],
  )

  // Clear and redraw background
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensionsRef.current
    const themeColors = artThemes[theme]

    ctx.fillStyle = themeColors.background
    ctx.fillRect(0, 0, width, height)
  }, [theme])

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      // Draw one static frame when paused
      draw(0)
      return
    }

    const animate = (timestamp: number) => {
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 16.67 : 1
      lastTimeRef.current = timestamp

      draw(deltaTime)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, draw])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const dpr = window.devicePixelRatio || 1

        canvas.width = width * dpr
        canvas.height = height * dpr
        dimensionsRef.current = { width, height }

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(dpr, dpr)
        }

        // Reinitialize flow points with new dimensions
        if (coordinates.length >= 2) {
          flowPointsRef.current = coordinatesToFlowPoints(coordinates, paces, width, height, bounds)

          // Reinitialize particles
          const options: FlowFieldOptions = {
            particleCount,
            trailLength,
            baseSpeed: 2,
            speedMultiplier: speed,
            averagePace,
            colorByPace,
            fadeRate: 0.5,
          }
          particlesRef.current = createParticles(flowPointsRef.current, options)
        }

        // Clear and redraw
        clearCanvas()
        draw(0)
      }
    })

    resizeObserver.observe(canvas)

    return () => {
      resizeObserver.disconnect()
    }
  }, [
    coordinates,
    paces,
    bounds,
    particleCount,
    trailLength,
    speed,
    averagePace,
    colorByPace,
    clearCanvas,
    draw,
  ])

  // Notify parent when canvas is ready
  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      onCanvasReady(canvasRef.current)
    }
  }, [onCanvasReady])

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full ${className}`}
      style={{ touchAction: 'none' }}
    />
  )
}
