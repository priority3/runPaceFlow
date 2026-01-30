'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ArtControlPanelProps {
  title: string
  children: ReactNode
  className?: string
}

/**
 * Control panel wrapper for art settings
 */
export function ArtControlPanel({ title, children, className = '' }: ArtControlPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-white/20 bg-white/50 p-3 backdrop-blur-xl sm:p-4 dark:border-white/10 dark:bg-black/20 ${className}`}
    >
      <h4 className="text-label/80 mb-3 text-sm font-medium">{title}</h4>
      <div className="space-y-3">{children}</div>
    </motion.div>
  )
}

interface ControlRowProps {
  label: string
  children: ReactNode
}

/**
 * Single control row with label
 * Stacks vertically on mobile, horizontal on larger screens
 */
export function ControlRow({ label, children }: ControlRowProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-label/60 text-sm">{label}</span>
      {children}
    </div>
  )
}

interface ToggleButtonProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

/**
 * Toggle button for boolean settings
 */
export function ToggleButton({ active, onClick, children }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-blue text-white'
          : 'bg-fill-tertiary text-label/60 hover:bg-fill-secondary hover:text-label'
      }`}
    >
      {children}
    </button>
  )
}

interface SliderControlProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
}

/**
 * Slider control for numeric values
 * Full width on mobile, fixed width on larger screens
 */
export function SliderControl({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
}: SliderControlProps) {
  return (
    <div className="flex w-full items-center gap-3 sm:w-auto">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-fill-tertiary accent-blue h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full sm:w-24 sm:flex-none"
      />
      <span className="text-label/60 w-12 shrink-0 text-right text-sm tabular-nums">
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
  )
}

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}

/**
 * Segmented control for selecting between options
 * Scrollable on mobile if needed
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="bg-fill-tertiary inline-flex w-full overflow-x-auto rounded-lg p-1 sm:w-auto">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option.value
              ? 'text-label bg-white shadow-sm dark:bg-black/40'
              : 'text-label/60 hover:text-label'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
