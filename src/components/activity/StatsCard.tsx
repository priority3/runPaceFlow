/**
 * StatsCard Component
 *
 * Glassmorphic design - content shown immediately without blocking animations
 */

'use client'

import { cn } from '@/lib/utils'

export interface StatsCardProps {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  className?: string
  icon?: React.ReactNode
  /** @deprecated Animation removed for instant content display */
  animateNumber?: boolean
  /** @deprecated Animation removed for instant content display */
  delay?: number
}

export function StatsCard({ title, value, unit, subtitle, className, icon }: StatsCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl p-5 sm:p-6',
        'bg-white/60 dark:bg-black/20',
        'backdrop-blur-xl backdrop-saturate-150',
        'border border-white/20 dark:border-white/10',
        'shadow-sm shadow-black/5',
        'transition-colors duration-150',
        'hover:bg-white/70 dark:hover:bg-black/30',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-label/60 text-xs font-medium tracking-wider uppercase">{title}</span>
        {icon && <span className="text-label/40">{icon}</span>}
      </div>

      {/* Value - shown immediately */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-label text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
          {value}
        </span>
        {unit && <span className="text-label/50 text-sm font-medium sm:text-base">{unit}</span>}
      </div>

      {/* Subtitle */}
      {subtitle && <p className="text-label/40 mt-2 text-xs">{subtitle}</p>}
    </div>
  )
}
