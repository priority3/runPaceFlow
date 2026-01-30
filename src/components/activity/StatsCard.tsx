/**
 * StatsCard Component
 *
 * Glassmorphic design with trend indicators, progress bars, animated numbers, and sparkline
 */

'use client'

import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'

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
  /** Goal value for progress calculation (in raw units) */
  goal?: number
  /** Goal display value (converted to display units, e.g., km instead of meters) */
  goalDisplayValue?: number
  /** Goal unit label */
  goalUnit?: string
  /** Sparkline data points (7 days trend) */
  sparklineData?: number[]
  /** Sparkline color - defaults to blue */
  sparklineColor?: string
}

/**
 * Calculate trend percentage between current and previous values
 */
function calculateTrend(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

/**
 * Sparkline component using SVG
 */
function Sparkline({
  data,
  color = 'var(--color-blue)',
  width = 80,
  height = 24,
}: {
  data: number[]
  color?: string
  width?: number
  height?: number
}) {
  const { path, areaPath, points } = useMemo(() => {
    if (!data || data.length < 2) return { path: '', areaPath: '', points: [] }

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    // Calculate points with padding
    const padding = 2
    const effectiveWidth = width - padding * 2
    const effectiveHeight = height - padding * 2

    const pts = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * effectiveWidth,
      y: padding + effectiveHeight - ((value - min) / range) * effectiveHeight,
    }))

    // Create smooth curve path using quadratic bezier
    let linePath = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const midX = (prev.x + curr.x) / 2
      linePath += ` Q ${prev.x} ${prev.y} ${midX} ${(prev.y + curr.y) / 2}`
    }
    const lastPt = pts[pts.length - 1]
    linePath += ` L ${lastPt.x} ${lastPt.y}`

    // Create area path for gradient fill
    const area = `${linePath} L ${lastPt.x} ${height} L ${pts[0].x} ${height} Z`

    return { path: linePath, areaPath: area, points: pts }
  }, [data, width, height])

  if (!data || data.length < 2) return null

  const gradientId = `sparkline-gradient-${Math.random().toString(36).slice(2)}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Line */}
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* End point dot */}
      {points.length > 0 && (
        <motion.circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2.5}
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, duration: 0.2 }}
        />
      )}
    </svg>
  )
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
  goalDisplayValue,
  goalUnit,
  sparklineData,
  sparklineColor,
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
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(value.toString())
  const isNumeric = !isNaN(numericValue)
  const decimals =
    typeof value === 'string' && value.includes('.') ? value.split('.')[1]?.length || 0 : 0

  // Determine sparkline color based on trend
  const effectiveSparklineColor =
    sparklineColor ||
    (isTrendPositive
      ? 'var(--color-green)'
      : isTrendNegative
        ? 'var(--color-red)'
        : 'var(--color-blue)')

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

      {/* Value with trend and sparkline */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-label text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {isNumeric ? <AnimatedNumber value={numericValue} decimals={decimals} /> : value}
          </span>
          {unit && <span className="text-label/50 text-sm font-medium sm:text-base">{unit}</span>}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length >= 2 && (
          <div className="mb-1 flex-shrink-0">
            <Sparkline data={sparklineData} color={effectiveSparklineColor} />
          </div>
        )}
      </div>

      {/* Trend indicator */}
      {trend !== null && (
        <div className="mt-2 flex items-center gap-1">
          <div
            className={cn(
              'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
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
          {subtitle && <span className="text-label/40 text-xs">{subtitle}</span>}
        </div>
      )}

      {/* Goal progress bar */}
      {goal && goalProgress !== null && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-label/40">目标进度</span>
            <span className="text-label/60 tabular-nums">
              {Math.round(goalProgress)}% / {goalDisplayValue ?? goal}
              {goalUnit}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <motion.div
              key={`progress-${title}-${goalProgress}`}
              className={cn(
                'h-full rounded-full',
                goalProgress >= 100 ? 'bg-green' : goalProgress >= 50 ? 'bg-blue' : 'bg-orange',
              )}
              initial={{ width: '0%' }}
              animate={{ width: `${goalProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Subtitle (when no trend) */}
      {subtitle && trend === null && <p className="text-label/40 mt-2 text-xs">{subtitle}</p>}
    </motion.div>
  )
}
