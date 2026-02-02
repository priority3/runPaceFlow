'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { ArtTheme, PremiumPalette } from '@/lib/art/colors'
import { artThemes } from '@/lib/art/colors'
import type {
  FingerprintOptions,
  FingerprintRing,
  FingerprintSplit,
  PremiumRenderOptions,
} from '@/lib/art/fingerprint'
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
  /** Color palette for premium rendering */
  palette?: PremiumPalette
  /** Enable premium multi-layer rendering effects */
  usePremiumRendering?: boolean
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
  palette = 'default',
  usePremiumRendering = true,
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

    // Calculate pace range for smooth color interpolation
    const paces = splits.map((s) => s.pace)
    const minPace = Math.min(...paces)
    const maxPace = Math.max(...paces)

    const options: FingerprintOptions = {
      mode,
      averagePace,
      maxHeartRate,
      minElevation,
      maxElevation,
      baseRadius: 40,
      ringSpacing: usePremiumRendering ? -2 : 6, // Overlap for premium, gap for classic
      minThickness: usePremiumRendering ? 8 : 4,
      maxThickness: usePremiumRendering ? 24 : 16,
      usePremiumColors: usePremiumRendering,
      palette,
      minPace,
      maxPace,
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
  }, [
    splits,
    mode,
    averagePace,
    maxHeartRate,
    showRadialLines,
    elevationData,
    palette,
    usePremiumRendering,
  ])

  // Draw function
  const draw = useCallback(
    (currentRotation: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Use CSS dimensions (not pixel dimensions) since ctx.scale(dpr) is already applied
      const dpr = window.devicePixelRatio || 1
      const width = canvas.width / dpr
      const height = canvas.height / dpr
      const centerX = width / 2
      const centerY = height / 2

      // Get theme colors
      const themeColors = artThemes[theme]

      // Clear canvas with background
      ctx.fillStyle = themeColors.background
      ctx.fillRect(0, 0, width, height)

      // Calculate auto-scale to fit within canvas with padding
      const maxRadius = calculateFingerprintRadius(rings)
      const padding = 40 // Padding from edges
      const availableSize = Math.min(width, height) - padding * 2
      const autoScale = maxRadius > 0 ? availableSize / (maxRadius * 2) : 1
      const finalScale = scale * Math.min(autoScale, 1) // Don't scale up, only down

      // Apply scale
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.scale(finalScale, finalScale)
      ctx.translate(-centerX, -centerY)

      // Premium render options
      const premiumOptions: PremiumRenderOptions = usePremiumRendering
        ? {
            enableGlow: true,
            enableDepth: true,
            enableHighlight: true,
            enableCenterGlow: true,
            glowIntensity: 0.15,
            theme,
          }
        : {
            enableGlow: false,
            enableDepth: false,
            enableHighlight: false,
            enableCenterGlow: false,
          }

      // Draw fingerprint
      drawFingerprint(
        ctx,
        rings,
        centerX,
        centerY,
        currentRotation,
        showRadialLines ? radialLines : undefined,
        premiumOptions,
      )

      ctx.restore()
    },
    [rings, radialLines, scale, showRadialLines, theme, usePremiumRendering],
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
