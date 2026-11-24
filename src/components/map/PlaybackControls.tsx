/**
 * PlaybackControls — glass control bar on the map for play / scrub / speed.
 */

'use client'

import { motion } from 'framer-motion'
import { Pause, Play, RotateCcw } from 'lucide-react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useRef } from 'react'

import { pressable, springs } from '@/lib/animation'
import { formatDuration, formatPace, paceToSpeed } from '@/lib/pace/calculator'
import { cn } from '@/lib/utils'

type MetricMode = 'pace' | 'speed'
type SpeedOption = 0.5 | 1 | 2

const SPEED_OPTIONS: SpeedOption[] = [0.5, 1, 2]

export interface PlaybackControlsProps {
  isPlaying: boolean
  progress: number
  speed: SpeedOption
  averagePace: number
  currentPace?: number
  currentDistanceMeters?: number
  currentElapsedSeconds?: number
  totalDistanceMeters?: number
  totalElapsedSeconds?: number
  metric?: MetricMode
  accentColor?: string
  className?: string
  onPlayPause: () => void
  onStop: () => void
  onSeek: (progress: number) => void
  onSpeedChange: (speed: SpeedOption) => void
}

export function PlaybackControls({
  isPlaying,
  progress,
  speed,
  averagePace,
  currentPace,
  currentDistanceMeters = 0,
  currentElapsedSeconds = 0,
  totalDistanceMeters = 0,
  totalElapsedSeconds = 0,
  metric = 'pace',
  accentColor,
  className,
  onPlayPause,
  onStop,
  onSeek,
  onSpeedChange,
}: PlaybackControlsProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const isSpeedMode = metric === 'speed'
  const displayPace = currentPace ?? averagePace
  const metricValue = isSpeedMode ? paceToSpeed(displayPace).toFixed(1) : formatPace(displayPace)
  const metricUnit = isSpeedMode ? 'km/h' : '/km'
  const accent = accentColor || 'rgb(var(--color-accent))'
  const clampedProgress = Math.min(100, Math.max(0, progress))
  const currentDistance = (currentDistanceMeters / 1000).toFixed(2)
  const totalDistance = (totalDistanceMeters / 1000).toFixed(2)

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      onSeek(ratio * 100)
    },
    [onSeek],
  )

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    seekFromClientX(event.clientX)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    seekFromClientX(event.clientX)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <motion.div
      className={cn(
        // Default: docked under the map (not absolute over the stats card)
        'bg-tertiary-system-background/96 pointer-events-auto px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-3.5',
        className,
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.soft}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex shrink-0 items-center gap-1">
          <motion.button
            type="button"
            onClick={onPlayPause}
            className={cn(
              'focus-visible:outline-label flex h-10 w-10 items-center justify-center rounded-full transition-[background-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-none',
              isPlaying
                ? 'bg-secondary-system-fill text-label shadow-[inset_0_0_0_1px_rgb(var(--color-separator))]'
                : 'bg-accent text-accent-content',
            )}
            whileHover={pressable.whileHover}
            whileTap={pressable.whileTap}
            transition={pressable.transition}
            aria-label={isPlaying ? '暂停回放' : '开始回放'}
            title={isPlaying ? '暂停回放' : '开始回放'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </motion.button>

          <motion.button
            type="button"
            onClick={onStop}
            className="text-secondary-label hover:bg-system-fill hover:text-label focus-visible:outline-label flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-none"
            whileTap={pressable.whileTap}
            transition={pressable.transition}
            aria-label="停止回放"
            title="重置回放"
          >
            <RotateCcw className="h-4 w-4" />
          </motion.button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="font-data text-label shrink-0 text-base font-semibold tabular-nums sm:text-lg">
              {currentDistance}
              <span className="text-tertiary-label ml-1 text-[11px] font-normal">km</span>
            </span>
            <span className="text-tertiary-label hidden truncate text-[11px] sm:inline">
              / {totalDistance} km
            </span>
          </div>
          <div className="text-secondary-label mt-0.5 flex min-w-0 items-baseline gap-2 text-[11px]">
            <span className="font-data tabular-nums" style={{ color: accent }}>
              {metricValue} <span className="text-tertiary-label font-normal">{metricUnit}</span>
            </span>
            <span className="text-tertiary-label">·</span>
            <span className="font-data tabular-nums">{formatDuration(currentElapsedSeconds)}</span>
          </div>
        </div>

        <div
          className="bg-secondary-system-fill/80 flex shrink-0 items-center gap-0.5 rounded-lg p-0.5"
          role="group"
          aria-label="回放倍速"
        >
          {SPEED_OPTIONS.map((option) => {
            const selected = speed === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => onSpeedChange(option)}
                className={cn(
                  'focus-visible:outline-label min-w-9 rounded-md px-2 py-1.5 text-[11px] font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-none',
                  selected
                    ? 'bg-tertiary-system-background text-label shadow-[0_0_0_1px_rgb(var(--color-separator))]'
                    : 'text-tertiary-label hover:text-secondary-label',
                )}
                aria-pressed={selected}
              >
                {option}x
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrub timeline */}
      <div
        ref={trackRef}
        className="group relative mt-3 cursor-pointer touch-none px-1 pt-1 pb-0.5 focus-visible:outline-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clampedProgress)}
        aria-valuetext={`${Math.round(clampedProgress)}%，${formatDuration(currentElapsedSeconds)} / ${formatDuration(totalElapsedSeconds)}`}
        aria-label="回放进度"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') onSeek(Math.min(100, progress + 2))
          if (event.key === 'ArrowLeft') onSeek(Math.max(0, progress - 2))
        }}
      >
        <div className="bg-quaternary-system-fill relative h-1 rounded-full">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
            style={{
              width: `${clampedProgress}%`,
              backgroundColor: accent,
            }}
          />
          <div
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-transform group-hover:scale-110 group-focus-visible:scale-110"
            style={{
              left: `${clampedProgress}%`,
              backgroundColor: 'rgb(var(--color-tertiarySystemBackground))',
              boxShadow: `0 0 0 1px ${accent}88, 0 2px 7px rgba(36,35,31,0.18)`,
            }}
          />
        </div>
        <div className="text-tertiary-label mt-2 flex items-center justify-between text-[10px] tabular-nums">
          <span>{formatDuration(currentElapsedSeconds)}</span>
          <span className="font-medium" style={{ color: accent }}>
            {Math.round(clampedProgress)}%
          </span>
          <span>{formatDuration(totalElapsedSeconds)}</span>
        </div>
      </div>
    </motion.div>
  )
}
