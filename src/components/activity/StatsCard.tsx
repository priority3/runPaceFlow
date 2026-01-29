/**
 * StatsCard Component
 *
 * Glassmorphic design with trend indicators, progress bars, and animated numbers
 */

'use client'

import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'

import { AnimatedNumber } from '@/components/ui/animated-number'
import { cn } from '@/lib/utils'

export interface StatsCardProps {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  className?: string
  icon?: React.ReactNode
  /** Current value for trend calculation */
  currentValue?: number
  /** Previous value for trend calculation */
  previousValue?: number
  /** Whether higher is better (true) or lower is better (false, e.g., pace) */
  higherIsBetter?: boolean
  /** Goal value for progress bar */
  goal?: number
  /** Goal unit label */
  goalUnit?: string
}

/**
 * Calculate trend percentage between current and previous values
 */
function calculateTrend(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

export function StatsCard({
  title,
  value,
  unit,
  subtitle,
  className,
  icon,
  currentValue,
  previousValue,
  higherIsBetter = true,
  goal,
  goalUnit,
}: StatsCardProps) {
  // Calculate trend if both values provided
  const trend =
    currentValue !== undefined && previousValue !== undefined
      ? calculateTrend(currentValue, previousValue)
      : null

  // Determine if trend is positive (good) based on higherIsBetter
  const isTrendPositive = trend !== null && (higherIsBetter ? trend > 0 : trend < 0)
  const isTrendNegative = trend !== null && (higherIsBetter ? trend < 0 : trend > 0)

  // Calculate goal progress
  const goalProgress = goal && currentValue ? Math.min((currentValue / goal) * 100, 100) : null

  // Parse numeric value for animation
  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString())
  const isNumeric = !isNaN(numericValue)
  const decimals =
    typeof value === 'string' && value.includes('.') ? value.split('.')[1]?.length || 0 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
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

      {/* Value with trend */}
      <div className="flex items-baseline gap-2">
        <span className="text-label text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
          {isNumeric ? <AnimatedNumber value={numericValue} decimals={decimals} /> : value}
        </span>
        {unit && <span className="text-label/50 text-sm font-medium sm:text-base">{unit}</span>}

        {/* Trend indicator */}
        {trend !== null && (
          <div
            className={cn(
              'ml-auto flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
              isTrendPositive && 'bg-green/10 text-green',
              isTrendNegative && 'bg-red/10 text-red',
              !isTrendPositive && !isTrendNegative && 'bg-gray/10 text-label/50',
            )}
          >
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            <span>{Math.abs(Math.round(trend))}%</span>
          </div>
        )}
      </div>

      {/* Goal progress bar */}
      {goal && goalProgress !== null && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-label/40">目标进度</span>
            <span className="text-label/60 tabular-nums">
              {Math.round(goalProgress)}% / {goal}
              {goalUnit}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                goalProgress >= 100 ? 'bg-green' : goalProgress >= 50 ? 'bg-blue' : 'bg-orange',
              )}
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && <p className="text-label/40 mt-2 text-xs">{subtitle}</p>}
    </motion.div>
  )
}
