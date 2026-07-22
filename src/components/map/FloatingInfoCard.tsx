/**
 * FloatingInfoCard Component
 *
 * Displays real-time information during route playback
 */

'use client'

import type { CSSProperties } from 'react'

import type { TrackPoint } from '@/lib/map/pace-utils'
import { formatDuration, formatPace, paceToSpeed } from '@/lib/pace/calculator'
import { useTheme } from '@/lib/theme'
import { getSportColors } from '@/lib/theme/palette'

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
  const { resolvedTheme } = useTheme()
  if (!currentPoint) return null

  const accent = currentPaceColor || getSportColors(resolvedTheme).running
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
        className="border-separator bg-tertiary-system-background/92 w-64 max-w-[calc(100vw-2rem)] rounded-lg border px-4 py-3 shadow-lg backdrop-blur-xl"
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
          <div className="text-secondary-label bg-secondary-system-background rounded-md px-2 py-1 text-xs tabular-nums">
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

        <div className="bg-system-fill/70 mt-3 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-[width] duration-100"
            style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
          />
        </div>
      </div>
    </div>
  )
}
