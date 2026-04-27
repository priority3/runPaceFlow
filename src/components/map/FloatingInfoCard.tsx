/**
 * FloatingInfoCard Component
 *
 * Displays real-time information during route playback
 */

'use client'

import type { CSSProperties } from 'react'

import type { TrackPoint } from '@/lib/map/pace-utils'
import { formatDuration, formatPace, paceToSpeed } from '@/lib/pace/calculator'

type MetricMode = 'pace' | 'speed'

export interface FloatingInfoCardProps {
  currentPoint?: TrackPoint
  startTime?: Date
  averagePace: number
  currentPace?: number
  currentPaceColor?: string
  isPlaying: boolean
  progress: number // 0-100
  metric?: MetricMode
}

/**
 * 浮动信息卡组件
 * 显示回放时的实时配速、距离、时间
 */
export function FloatingInfoCard({
  currentPoint,
  startTime,
  averagePace,
  currentPace,
  currentPaceColor,
  isPlaying,
  progress,
  metric = 'pace',
}: FloatingInfoCardProps) {
  if (!currentPoint) return null

  const accent = currentPaceColor || '#007AFF'
  const displayPace = currentPace ?? averagePace
  const isSpeedMode = metric === 'speed'
  const currentMetricValue = isSpeedMode
    ? paceToSpeed(displayPace).toFixed(1)
    : formatPace(displayPace)
  const averageMetricValue = isSpeedMode
    ? paceToSpeed(averagePace).toFixed(1)
    : formatPace(averagePace)
  const metricUnit = isSpeedMode ? 'km/h' : '/km'

  // 计算已用时间（优先用 GPX 时间戳）
  const elapsedTime = startTime
    ? Math.max(0, Math.floor((currentPoint.time.getTime() - startTime.getTime()) / 1000))
    : Math.floor((currentPoint.distance / 1000) * averagePace)

  return (
    <div className="pointer-events-none absolute top-4 left-4 z-10">
      <div
        className="w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/20 bg-white/80 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-black/65 dark:shadow-black/30"
        style={{ '--accent': accent } as CSSProperties}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-green' : 'bg-orange'}`} />
            <div className="min-w-0">
              <div className="text-label flex items-baseline gap-2 text-sm font-semibold">
                路线回放
                <span className="text-tertiary-label text-xs font-medium">
                  {isPlaying ? '回放中' : '已暂停'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-secondary-label rounded-full bg-white/60 px-2 py-1 text-xs tabular-nums dark:bg-black/30">
            {progress.toFixed(0)}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
          <div>
            <div className="text-tertiary-label text-xs">距离</div>
            <div className="text-label mt-0.5 text-lg font-semibold tabular-nums">
              {(currentPoint.distance / 1000).toFixed(2)}
              <span className="text-tertiary-label ml-1 text-xs font-medium">km</span>
            </div>
          </div>

          <div>
            <div className="text-tertiary-label text-xs">
              {isSpeedMode ? '当前速度' : '当前配速'}
            </div>
            <div
              className="mt-0.5 text-lg font-semibold tabular-nums"
              style={{ color: 'var(--accent)' }}
            >
              {currentMetricValue}
              <span className="text-tertiary-label ml-1 text-xs font-medium">{metricUnit}</span>
            </div>
          </div>

          <div>
            <div className="text-tertiary-label text-xs">用时</div>
            <div className="text-label mt-0.5 text-lg font-semibold tabular-nums">
              {formatDuration(elapsedTime)}
            </div>
          </div>

          <div>
            <div className="text-tertiary-label text-xs">
              {isSpeedMode ? '平均速度' : '平均配速'}
            </div>
            <div className="text-label mt-0.5 text-lg font-semibold tabular-nums">
              {averageMetricValue}
              <span className="text-tertiary-label ml-1 text-xs font-medium">{metricUnit}</span>
            </div>
          </div>
        </div>

        <div className="bg-fill/70 mt-3 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-[width] duration-100"
            style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
          />
        </div>
      </div>
    </div>
  )
}
