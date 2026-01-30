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
      className={`rounded-xl border border-white/20 bg-white/50 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-black/20 ${className}`}
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
 */
export function ControlRow({ label, children }: ControlRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
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
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-fill-tertiary accent-blue h-1.5 w-24 cursor-pointer appearance-none rounded-full"
      />
      <span className="text-label/60 w-12 text-right text-sm tabular-nums">
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
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="bg-fill-tertiary inline-flex rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
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
