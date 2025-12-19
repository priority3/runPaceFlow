/**
 * AnimatedRoute Component
 *
 * Animates the drawing of a route with pace-based colors
 */

'use client'

import { useEffect, useRef, useState } from 'react'
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

      // 根据进度计算应该显示哪些段
      const totalSegments = segments.length
      const targetSegmentIndex = Math.floor(progress * totalSegments)
      const segmentProgress = (progress * totalSegments) % 1

      // 更新可见的段
      const visible = segments.slice(0, targetSegmentIndex + 1)

      // 如果最后一段还没完全显示，裁剪坐标
      if (targetSegmentIndex < totalSegments && segmentProgress < 1) {
        const lastSegment = segments[targetSegmentIndex]
        const totalPoints = lastSegment.coordinates.length
        const visiblePoints = Math.max(2, Math.floor(totalPoints * segmentProgress))

        visible[targetSegmentIndex] = {
          ...lastSegment,
          coordinates: lastSegment.coordinates.slice(0, visiblePoints),
        }
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
  }, [segments, isPlaying, speed, animationDuration, onProgressChange, onAnimationComplete])

  // 渲染可见的段
  return (
    <>
      {visibleSegments.map((segment, index) => {
        const geojson = {
          type: 'Feature' as const,
          properties: {
            pace: segment.pace,
            distance: segment.distance,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: segment.coordinates,
          },
        }

        return (
          <Source
            key={`${activityId}-animated-${segment.pace}-${segment.distance}`}
            id={`animated-segment-${activityId}-${index}`}
            type="geojson"
            data={geojson}
          >
            <Layer
              id={`animated-line-${activityId}-${index}`}
              type="line"
              paint={{
                'line-color': segment.color,
                'line-width': 4,
                'line-opacity': 0.9,
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
            />
          </Source>
        )
      })}
    </>
  )
}
