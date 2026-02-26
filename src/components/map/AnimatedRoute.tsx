/**
 * AnimatedRoute Component
 *
 * Animates the drawing of a route with pace-based colors
 */

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'

import type { PaceSegment } from '@/lib/map/pace-utils'

export interface AnimatedRouteProps {
  segments: PaceSegment[]
  activityId: string
  isPlaying: boolean
  onProgressChange?: (progress: number) => void
  onAnimationComplete?: () => void
  speed?: number // 动画速度倍数，默认 1
}

/**
 * 动画绘制路线组件
 * 使用 requestAnimationFrame 实现平滑动画
 */
export function AnimatedRoute({
  segments,
  activityId,
  isPlaying,
  onProgressChange,
  onAnimationComplete,
  speed = 1,
}: AnimatedRouteProps) {
  const [visibleSegments, setVisibleSegments] = useState<PaceSegment[]>([])
  const animationRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number | undefined>(undefined)
  const pausedTimeRef = useRef<number>(0)
  const totalPausedTimeRef = useRef<number>(0)

  const segmentDistances = useMemo(
    () => segments.map((segment) => estimateSegmentDistance(segment.coordinates)),
    [segments],
  )

  const totalDistance = useMemo(
    () => segmentDistances.reduce((sum, dist) => sum + dist, 0),
    [segmentDistances],
  )

  // 动画持续时间（毫秒）
  const animationDuration = 5000 / speed // 5 秒基础时长，可通过 speed 调整

  useEffect(() => {
    if (!segments || segments.length === 0) return

    // 如果不是播放状态，清除动画
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = undefined
      }
      // 记录暂停时间
      if (startTimeRef.current && !pausedTimeRef.current) {
        pausedTimeRef.current = performance.now()
      }
      return
    }

    // 恢复播放：计算总暂停时长
    if (pausedTimeRef.current && startTimeRef.current) {
      totalPausedTimeRef.current += performance.now() - pausedTimeRef.current
      pausedTimeRef.current = 0
    }

    // 动画函数
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      // 计算实际经过的时间（排除暂停时间）
      const elapsed = timestamp - startTimeRef.current - totalPausedTimeRef.current
      const progress = Math.min(elapsed / animationDuration, 1)

      // 根据进度（距离）计算应该显示哪些段，避免分段数量不均导致的节奏跳动
      const targetDistance = totalDistance * progress

      const visible: PaceSegment[] = []
      let currentDistance = 0

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        const segmentDist = segmentDistances[i] ?? 0
        const nextDistance = currentDistance + segmentDist

        // Whole segment visible
        if (nextDistance <= targetDistance) {
          visible.push(segment)
          currentDistance = nextDistance
          continue
        }

        // Partially visible segment — clip by points as an approximation
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

      setVisibleSegments(visible)

      // 通知外部进度变化
      onProgressChange?.(progress * 100)

      // 如果动画未完成，继续
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // 动画完成
        onAnimationComplete?.()
        startTimeRef.current = undefined
        totalPausedTimeRef.current = 0
      }
    }

    // 启动动画
    animationRef.current = requestAnimationFrame(animate)

    // 清理函数
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    segments,
    segmentDistances,
    totalDistance,
    isPlaying,
    speed,
    animationDuration,
    onProgressChange,
    onAnimationComplete,
  ])

  // Reason: Combine all visible segments into a single GeoJSON FeatureCollection
  // so MapLibre only manages one Source + Layer instead of N, reducing GPU overhead.
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
          'line-color': '#0f172a',
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
          // Reason: data-driven styling — each feature's color comes from its
          // properties, so a single layer can render multi-colored segments.
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
  const R = 6371000 // meters
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
