'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { ArtTheme } from '@/lib/art/colors'
import { artThemes } from '@/lib/art/colors'
import type { FingerprintOptions, FingerprintRing, FingerprintSplit } from '@/lib/art/fingerprint'
import {
  calculateFingerprintRadius,
  calculateRadialLines,
  drawFingerprint,
  generateFingerprintRings,
} from '@/lib/art/fingerprint'

interface FingerprintCanvasProps {
  splits: FingerprintSplit[]
  mode: 'pace' | 'heartrate' | 'elevation'
  averagePace: number
  maxHeartRate?: number
  elevationData?: number[]
  rotation?: number
  scale?: number
  showRadialLines?: boolean
  animateRotation?: boolean
  theme?: ArtTheme
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
  className?: string
}

/**
 * Canvas component for rendering running fingerprint visualization
 */
export function FingerprintCanvas({
  splits,
  mode,
  averagePace,
  maxHeartRate = 190,
  elevationData = [],
  rotation = 0,
  scale = 1,
  showRadialLines = true,
  animateRotation = false,
  theme = 'default',
  onCanvasReady,
  className = '',
}: FingerprintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const [rings, setRings] = useState<FingerprintRing[]>([])
  const [radialLines, setRadialLines] = useState<Array<{ angle: number; length: number }>>([])
  const currentRotationRef = useRef(rotation)

  // Generate rings when data changes
  useEffect(() => {
    if (splits.length === 0) return

    // Calculate elevation range if needed
    const elevations = splits.map((s) => s.elevation).filter((e): e is number => e !== undefined)
    const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0
    const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 100

    const options: FingerprintOptions = {
      mode,
      averagePace,
      maxHeartRate,
      minElevation,
      maxElevation,
      baseRadius: 40,
      ringSpacing: 6,
      minThickness: 4,
      maxThickness: 16,
    }

    const generatedRings = generateFingerprintRings(splits, options)
    setRings(generatedRings)

    // Generate radial lines for elevation mode
    if (showRadialLines && elevationData.length > 0) {
      const maxRadius = calculateFingerprintRadius(generatedRings)
      const lines = calculateRadialLines(elevationData, 72, maxRadius)
      setRadialLines(lines)
    } else {
      setRadialLines([])
    }
  }, [splits, mode, averagePace, maxHeartRate, showRadialLines, elevationData])

  // Draw function
  const draw = useCallback(
    (currentRotation: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { width, height } = canvas
      const centerX = width / 2
      const centerY = height / 2

      // Get theme colors
      const themeColors = artThemes[theme]

      // Clear canvas with background
      ctx.fillStyle = themeColors.background
      ctx.fillRect(0, 0, width, height)

      // Apply scale
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.scale(scale, scale)
      ctx.translate(-centerX, -centerY)

      // Draw fingerprint
      drawFingerprint(
        ctx,
        rings,
        centerX,
        centerY,
        currentRotation,
        showRadialLines ? radialLines : undefined,
      )

      ctx.restore()
    },
    [rings, radialLines, scale, showRadialLines, theme],
  )

  // Animation loop
  useEffect(() => {
    if (!animateRotation) {
      // Draw static frame
      draw(rotation)
      return
    }

    let startTime: number | null = null
    const rotationSpeed = 0.0005 // radians per ms

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime

      currentRotationRef.current = rotation + elapsed * rotationSpeed
      draw(currentRotationRef.current)

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animateRotation, rotation, draw])

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

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(dpr, dpr)
        }

        // Redraw after resize
        draw(currentRotationRef.current)
      }
    })

    resizeObserver.observe(canvas)

    return () => {
      resizeObserver.disconnect()
    }
  }, [draw])

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
