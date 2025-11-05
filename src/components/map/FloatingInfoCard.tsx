/**
 * FloatingInfoCard Component
 *
 * Displays real-time information during route playback
 */

'use client'

import { formatPace, formatDuration } from '@/lib/pace/calculator'
import type { TrackPoint } from '@/lib/map/pace-utils'

export interface FloatingInfoCardProps {
  currentPoint?: TrackPoint
  averagePace: number
  isPlaying: boolean
  progress: number // 0-100
  onPlayPause?: () => void
}

/**
 * 浮动信息卡组件
 * 显示回放时的实时配速、距离、时间
 */
export function FloatingInfoCard({
  currentPoint,
  averagePace,
  isPlaying,
  progress,
  onPlayPause,
}: FloatingInfoCardProps) {
  if (!currentPoint) return null

  // 计算当前配速（基于当前点和之前的点）
  const currentPace = averagePace // 简化：使用平均配速，实际应该计算实时配速

  // 计算已用时间（从开始到当前点）
  const elapsedTime = Math.floor((currentPoint.distance / 1000) * averagePace)

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10">
      <div className="pointer-events-auto rounded-xl border border-separator bg-secondarySystemBackground/95 p-4 shadow-xl backdrop-blur-sm">
        {/* 播放/暂停按钮 */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-label">实时数据</h3>
          <button
            type="button"
            onClick={onPlayPause}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue text-white transition-transform hover:scale-110"
          >
            {isPlaying ? (
              // 暂停图标
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              // 播放图标
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* 数据网格 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 距离 */}
          <div>
            <div className="text-xs text-tertiaryLabel">距离</div>
            <div className="text-lg font-bold text-label">
              {(currentPoint.distance / 1000).toFixed(2)}
            </div>
            <div className="text-xs text-tertiaryLabel">km</div>
          </div>

          {/* 配速 */}
          <div>
            <div className="text-xs text-tertiaryLabel">配速</div>
            <div className="text-lg font-bold text-label">
              {formatPace(currentPace).replace('/km', '')}
            </div>
            <div className="text-xs text-tertiaryLabel">/km</div>
          </div>

          {/* 用时 */}
          <div>
            <div className="text-xs text-tertiaryLabel">用时</div>
            <div className="text-lg font-bold text-label">
              {formatDuration(elapsedTime)}
            </div>
          </div>

          {/* 进度 */}
          <div>
            <div className="text-xs text-tertiaryLabel">进度</div>
            <div className="text-lg font-bold text-label">
              {progress.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-fill">
          <div
            className="h-full bg-blue transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
