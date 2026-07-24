/**
 * PlaybackControls — glass control bar on the map for play / scrub / speed.
 */

'use client'

import { motion } from 'framer-motion'
import { Pause, Play, Square } from 'lucide-react'
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
        'bg-tertiary-system-background/92 pointer-events-auto px-3 py-2.5 backdrop-blur-xl sm:px-4',
        className,
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.soft}
    >
      <div className="mb-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            onClick={onPlayPause}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
              isPlaying ? 'bg-secondary-system-fill text-label' : 'bg-accent text-accent-content',
            )}
            whileHover={pressable.whileHover}
            whileTap={pressable.whileTap}
            transition={pressable.transition}
            aria-label={isPlaying ? '暂停回放' : '开始回放'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </motion.button>

          <motion.button
            type="button"
            onClick={onStop}
            className="text-secondary-label hover:bg-system-fill hover:text-label flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            whileTap={pressable.whileTap}
            transition={pressable.transition}
            aria-label="停止回放"
          >
            <Square className="h-3.5 w-3.5" />
          </motion.button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-label flex items-baseline gap-2 text-sm font-medium">
            <span className="font-data tabular-nums">
              {(currentDistanceMeters / 1000).toFixed(2)}
              <span className="text-tertiary-label ml-0.5 text-[11px] font-normal">km</span>
            </span>
            <span className="text-tertiary-label text-[11px]">·</span>
            <span className="font-data tabular-nums" style={{ color: accent }}>
              {metricValue}
              <span className="text-tertiary-label ml-0.5 text-[11px] font-normal">
                {metricUnit}
              </span>
            </span>
            <span className="text-tertiary-label hidden text-[11px] sm:inline">·</span>
            <span className="font-data text-secondary-label hidden text-sm tabular-nums sm:inline">
              {formatDuration(currentElapsedSeconds)}
            </span>
          </div>
        </div>

        <div
          className="bg-secondary-system-fill/80 flex items-center gap-0.5 rounded-full p-0.5"
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
                  'min-w-9 rounded-full px-2 py-1 text-[11px] font-medium tabular-nums transition-colors',
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

      {/* Scrub track */}
      <div
        ref={trackRef}
        className="bg-quaternary-system-fill group relative h-2 cursor-pointer touch-none rounded-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="回放进度"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') onSeek(Math.min(100, progress + 2))
          if (event.key === 'ArrowLeft') onSeek(Math.max(0, progress - 2))
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: accent,
          }}
        />
        <div
          className="border-tertiary-system-background absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 bg-white shadow-sm transition-transform group-hover:scale-110"
          style={{
            left: `calc(${progress}% - 7px)`,
            backgroundColor: 'rgb(var(--color-tertiarySystemBackground))',
            boxShadow: `0 0 0 1px ${accent}55, 0 2px 8px rgba(36,35,31,0.12)`,
          }}
        />
      </div>
    </motion.div>
  )
}
