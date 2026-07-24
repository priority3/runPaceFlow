/**
 * AnimatedRoute Component
 *
 * Draws pace-colored route with play/pause and external seek (scrub).
 */

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'

import type { PaceSegment } from '@/lib/map/pace-utils'
import { useTheme } from '@/lib/theme'
import { getTrainingColors } from '@/lib/theme/palette'

export interface AnimatedRouteProps {
  segments: PaceSegment[]
  activityId: string
  isPlaying: boolean
  /** External progress 0-100. When scrubbing / paused, drives visible length. */
  progress?: number
  onProgressChange?: (progress: number) => void
  onAnimationComplete?: () => void
  speed?: number
}

/**
 * Clip segments so only the first `progressRatio` of total distance is visible.
 */
function clipSegmentsByProgress(
  segments: PaceSegment[],
  segmentDistances: number[],
  totalDistance: number,
  progressRatio: number,
): PaceSegment[] {
  if (segments.length === 0 || totalDistance <= 0) return []

  const targetDistance = totalDistance * Math.min(1, Math.max(0, progressRatio))
  if (targetDistance <= 0) return []

  const visible: PaceSegment[] = []
  let currentDistance = 0

  for (const [i, segment] of segments.entries()) {
    const segmentDist = segmentDistances[i] ?? 0
    const nextDistance = currentDistance + segmentDist

    if (nextDistance <= targetDistance) {
      visible.push(segment)
      currentDistance = nextDistance
      continue
    }

    const remaining = Math.max(0, targetDistance - currentDistance)
    const fraction = segmentDist > 0 ? Math.min(1, remaining / segmentDist) : 1
    const totalPoints = segment.coordinates.length
    const visiblePoints = Math.max(2, Math.floor(totalPoints * fraction))

    visible.push({
      ...segment,
      coordinates: segment.coordinates.slice(0, Math.min(totalPoints, visiblePoints)),
    })
    break
  }

  return visible
}

export function AnimatedRoute({
  segments,
  activityId,
  isPlaying,
  progress = 0,
  onProgressChange,
  onAnimationComplete,
  speed = 1,
}: AnimatedRouteProps) {
  const { resolvedTheme } = useTheme()
  const trainingColors = getTrainingColors(resolvedTheme)
  const [visibleSegments, setVisibleSegments] = useState<PaceSegment[]>([])
  const animationRef = useRef<number | undefined>(undefined)
  // Anchor: when play starts, map wall-clock to current progress so scrub resumes cleanly.
  const playAnchorRef = useRef<{ wallMs: number; progressRatio: number } | null>(null)

  const { segmentDistances, totalDistance } = useMemo(() => {
    const distances = segments.map((segment) => estimateSegmentDistance(segment.coordinates))
    return {
      segmentDistances: distances,
      totalDistance: distances.reduce((sum, distance) => sum + distance, 0),
    }
  }, [segments])

  // Base full-route duration ~8s at 1x (was 5s/speed with speed=0.2 → very slow).
  // External `speed` multiplies: 0.5x slower, 2x faster.
  const animationDuration = 8000 / Math.max(0.25, speed)

  // When paused / scrubbing: paint from external progress.
  useEffect(() => {
    if (isPlaying) return
    playAnchorRef.current = null
    if (!segments.length || totalDistance <= 0) {
      setVisibleSegments([])
      return
    }
    setVisibleSegments(
      clipSegmentsByProgress(segments, segmentDistances, totalDistance, progress / 100),
    )
  }, [isPlaying, progress, segments, segmentDistances, totalDistance])

  // When playing: advance from current progress with rAF.
  useEffect(() => {
    if (!isPlaying || !segments.length || totalDistance <= 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = undefined
      }
      return
    }

    const startRatio = Math.min(0.999, Math.max(0, progress / 100))
    playAnchorRef.current = {
      wallMs: performance.now(),
      progressRatio: startRatio,
    }

    const animate = (timestamp: number) => {
      const anchor = playAnchorRef.current
      if (!anchor) return

      const elapsed = timestamp - anchor.wallMs
      // Remaining duration scales with what's left of the route.
      const remainingRatio = Math.max(0.001, 1 - anchor.progressRatio)
      const remainingDuration = animationDuration * remainingRatio
      const advanced = Math.min(1, elapsed / remainingDuration)
      const nextRatio = Math.min(1, anchor.progressRatio + remainingRatio * advanced)

      setVisibleSegments(
        clipSegmentsByProgress(segments, segmentDistances, totalDistance, nextRatio),
      )
      onProgressChange?.(nextRatio * 100)

      if (nextRatio < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        onAnimationComplete?.()
        playAnchorRef.current = null
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = undefined
      }
    }
    // Reason: only re-anchor when play starts / speed changes / route data changes —
    // not on every progress tick from ourselves (would reset animation).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- progress intentionally only read at play start
  }, [
    isPlaying,
    speed,
    animationDuration,
    segments,
    segmentDistances,
    totalDistance,
    onProgressChange,
    onAnimationComplete,
  ])

  const combinedGeoJson = useMemo(() => {
    if (visibleSegments.length === 0) return null

    return {
      type: 'FeatureCollection' as const,
      features: visibleSegments.map((segment) => ({
        type: 'Feature' as const,
        properties: {
          color: segment.color,
          pace: segment.pace,
          distance: segment.distance,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: segment.coordinates,
        },
      })),
    }
  }, [visibleSegments])

  if (!combinedGeoJson) return null

  return (
    <Source id={`animated-route-${activityId}`} type="geojson" data={combinedGeoJson}>
      <Layer
        id={`animated-line-glow-${activityId}`}
        type="line"
        paint={{
          'line-color': trainingColors.routeMono,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 7, 14, 10, 18, 18],
          'line-opacity': 0.18,
          'line-blur': 6,
        }}
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
      />
      <Layer
        id={`animated-line-${activityId}`}
        type="line"
        paint={{
          'line-color': ['get', 'color'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3.5, 14, 5, 18, 9],
          'line-opacity': 0.95,
        }}
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
      />
    </Source>
  )
}

function estimateSegmentDistance(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0

  let distance = 0
  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1] = coordinates[i - 1]
    const [lon2, lat2] = coordinates[i]
    distance += haversineDistance(lat1, lon1, lat2, lon2)
  }
  return distance
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
