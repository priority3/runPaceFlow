/**
 * PaceChart Component
 *
 * Bar chart with color-coded pace visualization and loading animation
 * Green = fast, Yellow = average, Red = slow
 */

'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatPace } from '@/lib/pace/calculator'

export interface Split {
  kilometer: number
  pace: number // seconds per km
  distance: number // meters
  duration: number // seconds
}

export interface PaceChartProps {
  splits: Split[]
  averagePace: number
  className?: string
}

/**
 * Get color based on pace relative to average
 * Green = faster than average, Yellow = near average, Red = slower than average
 */
function getPaceBarColor(pace: number, averagePace: number): string {
  const diff = pace - averagePace

  // Faster than average by 15+ seconds: bright green
  if (diff < -15) return '#22c55e'
  // Faster than average by 0-15 seconds: light green
  if (diff < 0) return '#84cc16'
  // Near average (±10 seconds): yellow
  if (diff < 10) return '#eab308'
  // Slower than average by 10-20 seconds: orange
  if (diff < 20) return '#f97316'
  // Slower than average by 20+ seconds: red
  return '#ef4444'
}

// Custom Tooltip component - glassmorphic style
const CustomTooltip = ({ active, payload, fastestKm, averagePace }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload
    const isFastest = data.kilometer === fastestKm
    const diff = data.pace - averagePace
    const diffText =
      diff < 0
        ? `快 ${Math.abs(Math.round(diff))}秒`
        : diff > 0
          ? `慢 ${Math.round(diff)}秒`
          : '平均'

    return (
      <div className="rounded-xl border border-white/30 bg-white/90 p-3 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-black/80">
        <p className="text-label mb-1 text-sm font-medium">
          第 {data.kilometer} 公里
          {isFastest && (
            <span className="bg-green/20 text-green ml-2 rounded-full px-2 py-0.5 text-xs">
              最快
            </span>
          )}
        </p>
        <p className="text-label text-lg font-semibold tabular-nums">{data.paceFormatted}</p>
        <p className="text-label/60 text-xs">vs 平均: {diffText}</p>
      </div>
    )
  }
  return null
}

/**
 * Pace bar chart component with color-coded bars
 */
export function PaceChart({ splits, averagePace, className }: PaceChartProps) {
  // Prevent SSR hydration mismatch with ResponsiveContainer
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!splits || splits.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-white/20 bg-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
        <p className="text-label/50">暂无配速数据</p>
      </div>
    )
  }

  // Show placeholder during SSR
  if (!isMounted) {
    return <div className="h-[300px] animate-pulse rounded-xl bg-white/30 dark:bg-black/10" />
  }

  // Prepare chart data
  const chartData = splits.map((split) => ({
    kilometer: split.kilometer,
    pace: split.pace,
    paceFormatted: `${formatPace(split.pace)}/km`,
    color: getPaceBarColor(split.pace, averagePace),
  }))

  // Find fastest split
  const fastestSplit = splits.reduce((min, split) => (split.pace < min.pace ? split : min))

  // Format Y axis (pace) - inverted so faster is higher
  const formatYAxis = (value: number) => {
    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Calculate Y axis domain with padding
  const minPace = Math.min(...splits.map((s) => s.pace))
  const maxPace = Math.max(...splits.map((s) => s.pace))
  const padding = 15 // seconds

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />

          <XAxis
            dataKey="kilometer"
            label={{
              value: '公里',
              position: 'insideBottom',
              offset: -5,
              style: { fill: 'rgba(107, 114, 128, 0.6)' },
            }}
            tick={{ fill: 'rgba(107, 114, 128, 0.6)', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(156, 163, 175, 0.3)' }}
            tickLine={{ stroke: 'rgba(156, 163, 175, 0.3)' }}
          />

          <YAxis
            tickFormatter={formatYAxis}
            label={{
              value: '配速',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'rgba(107, 114, 128, 0.6)' },
            }}
            tick={{ fill: 'rgba(107, 114, 128, 0.6)', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(156, 163, 175, 0.3)' }}
            tickLine={{ stroke: 'rgba(156, 163, 175, 0.3)' }}
            domain={[minPace - padding, maxPace + padding]}
            reversed // Invert so faster (lower pace) is at top
          />

          <Tooltip
            content={<CustomTooltip fastestKm={fastestSplit.kilometer} averagePace={averagePace} />}
            cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
          />

          {/* Average pace reference line */}
          <ReferenceLine
            y={averagePace}
            stroke="rgba(107, 114, 128, 0.6)"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `平均 ${formatPace(averagePace)}/km`,
              position: 'right',
              fill: 'rgba(107, 114, 128, 0.8)',
              fontSize: 11,
            }}
          />

          {/* Pace bars with color coding */}
          <Bar dataKey="pace" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.kilometer}`}
                fill={entry.color}
                fillOpacity={entry.kilometer === fastestSplit.kilometer ? 1 : 0.8}
                stroke={entry.kilometer === fastestSplit.kilometer ? entry.color : 'none'}
                strokeWidth={entry.kilometer === fastestSplit.kilometer ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Color legend with stagger animation */}
      <motion.div
        className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-[#22c55e]" />
          <span className="text-label/60">快 (&gt;15秒)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-[#84cc16]" />
          <span className="text-label/60">较快</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-[#eab308]" />
          <span className="text-label/60">平均</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-[#f97316]" />
          <span className="text-label/60">较慢</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-[#ef4444]" />
          <span className="text-label/60">慢 (&gt;20秒)</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
