'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { ArtTheme } from '@/lib/art/colors'
import { artThemes } from '@/lib/art/colors'
import type { ConstellationOptions, Star, StarConnection } from '@/lib/art/constellation'
import {
  drawBackgroundStars,
  drawConstellation,
  generateBackgroundStars,
  generateConnections,
  generateStars,
} from '@/lib/art/constellation'

interface ConstellationCanvasProps {
  markers: Array<{
    coordinate: { longitude: number; latitude: number }
    kilometer: number
    pace: number
  }>
  bounds: {
    minLng: number
    maxLng: number
    minLat: number
    maxLat: number
  }
  averagePace: number
  showLabels: boolean
  showConnections: boolean
  starSize: number
  twinkle: boolean
  theme?: ArtTheme
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
  className?: string
}

/**
 * Canvas component for rendering route constellation visualization
 */
export function ConstellationCanvas({
  markers,
  bounds,
  averagePace,
  showLabels,
  showConnections,
  starSize,
  twinkle,
  theme = 'default',
  onCanvasReady,
  className = '',
}: ConstellationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const [stars, setStars] = useState<Star[]>([])
  const [connections, setConnections] = useState<StarConnection[]>([])
  const [backgroundStars, setBackgroundStars] = useState<
    Array<{ x: number; y: number; size: number; brightness: number }>
  >([])
  const dimensionsRef = useRef({ width: 0, height: 0 })

  // Generate stars when data changes
  useEffect(() => {
    const { width, height } = dimensionsRef.current
    if (width === 0 || height === 0 || markers.length === 0) return

    const options: ConstellationOptions = {
      averagePace,
      baseStarSize: starSize * 3,
      showConnections,
      starDensity: 1,
    }

    const generatedStars = generateStars(markers, width, height, bounds, options)
    setStars(generatedStars)

    if (showConnections) {
      const generatedConnections = generateConnections(generatedStars, averagePace)
      setConnections(generatedConnections)
    } else {
      setConnections([])
    }

    // Generate background stars
    const bgStars = generateBackgroundStars(width, height, 150)
    setBackgroundStars(bgStars)
  }, [markers, bounds, averagePace, starSize, showConnections])

  // Draw function
  const draw = useCallback(
    (twinkleTime: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { width, height } = dimensionsRef.current
      const themeColors = artThemes[theme]

      // Clear canvas with background
      ctx.fillStyle = themeColors.background
      ctx.fillRect(0, 0, width, height)

      // Draw background stars
      drawBackgroundStars(ctx, backgroundStars, twinkle ? twinkleTime : 0)

      // Draw constellation
      drawConstellation(
        ctx,
        stars,
        showConnections ? connections : [],
        showLabels,
        twinkle ? twinkleTime : 0,
      )
    },
    [stars, connections, backgroundStars, showLabels, showConnections, twinkle, theme],
  )

  // Animation loop for twinkle effect
  useEffect(() => {
    if (!twinkle) {
      // Draw static frame
      draw(0)
      return
    }

    let startTime: number | null = null

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = (timestamp - startTime) / 1000 // Convert to seconds

      draw(elapsed)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [twinkle, draw])

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

        // Regenerate stars with new dimensions
        if (markers.length > 0) {
          const options: ConstellationOptions = {
            averagePace,
            baseStarSize: starSize * 3,
            showConnections,
            starDensity: 1,
          }

          const generatedStars = generateStars(markers, width, height, bounds, options)
          setStars(generatedStars)

          if (showConnections) {
            const generatedConnections = generateConnections(generatedStars, averagePace)
            setConnections(generatedConnections)
          }

          // Regenerate background stars
          const bgStars = generateBackgroundStars(width, height, 150)
          setBackgroundStars(bgStars)
        }

        // Redraw
        draw(0)
      }
    })

    resizeObserver.observe(canvas)

    return () => {
      resizeObserver.disconnect()
    }
  }, [markers, bounds, averagePace, starSize, showConnections, draw])

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
