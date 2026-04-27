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

import { formatPace, paceToSpeed } from '@/lib/pace/calculator'

type MetricMode = 'pace' | 'speed'

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
  metric?: MetricMode
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
const CustomTooltip = ({ active, payload, fastestKm, averagePace, metric }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload
    const isFastest = data.kilometer === fastestKm
    const isSpeedMode = metric === 'speed'
    const diff = isSpeedMode ? data.metricValue - paceToSpeed(averagePace) : data.pace - averagePace
    const diffText = isSpeedMode
      ? diff > 0
        ? `快 ${Math.abs(diff).toFixed(1)} km/h`
        : diff < 0
          ? `慢 ${Math.abs(diff).toFixed(1)} km/h`
          : '平均'
      : diff < 0
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
        <p className="text-label text-lg font-semibold tabular-nums">{data.metricFormatted}</p>
        <p className="text-label/60 text-xs">vs 平均: {diffText}</p>
      </div>
    )
  }
  return null
}

/**
 * Pace bar chart component with color-coded bars
 */
export function PaceChart({ splits, averagePace, className, metric = 'pace' }: PaceChartProps) {
  // Prevent SSR hydration mismatch with ResponsiveContainer
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const emptyText = metric === 'speed' ? '暂无速度数据' : '暂无配速数据'

  if (!splits || splits.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-white/20 bg-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
        <p className="text-label/50">{emptyText}</p>
      </div>
    )
  }

  // Show placeholder during SSR
  if (!isMounted) {
    return <div className="h-[300px] animate-pulse rounded-xl bg-white/30 dark:bg-black/10" />
  }

  // Prepare chart data
  const isSpeedMode = metric === 'speed'
  const formatMetric = (pace: number) =>
    isSpeedMode ? `${paceToSpeed(pace).toFixed(1)} km/h` : `${formatPace(pace)}/km`

  const chartData = splits.map((split) => ({
    kilometer: split.kilometer,
    pace: split.pace,
    metricValue: isSpeedMode ? paceToSpeed(split.pace) : split.pace,
    metricFormatted: formatMetric(split.pace),
    color: getPaceBarColor(split.pace, averagePace),
  }))

  // Find fastest split
  const fastestSplit = splits.reduce((min, split) => (split.pace < min.pace ? split : min))

  // Format Y axis
  const formatYAxis = (value: number) => {
    if (isSpeedMode) return value.toFixed(1)
    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Calculate Y axis domain with padding
  const metricValues = chartData.map((item) => item.metricValue)
  const minMetricValue = Math.min(...metricValues)
  const maxMetricValue = Math.max(...metricValues)
  const padding = isSpeedMode ? 1 : 15
  const shouldRotateXTicks = splits.length > 16

  const axisTick = {
    fill: 'rgb(var(--color-label))',
    fontSize: 12,
    fontWeight: 500,
  }

  const axisLabelStyle = {
    fill: 'rgba(var(--color-secondaryLabel))',
    fontSize: 11,
    fontWeight: 500,
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 10, bottom: shouldRotateXTicks ? 22 : 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(var(--color-separator))"
            vertical={false}
          />

          <XAxis
            dataKey="kilometer"
            label={{
              value: '公里',
              position: 'insideBottom',
              offset: -5,
              style: axisLabelStyle,
            }}
            interval={0}
            tick={axisTick}
            axisLine={{ stroke: 'rgba(var(--color-separator))' }}
            tickLine={{ stroke: 'rgba(var(--color-separator))' }}
            angle={shouldRotateXTicks ? -45 : 0}
            textAnchor={shouldRotateXTicks ? 'end' : 'middle'}
            height={shouldRotateXTicks ? 44 : undefined}
            tickMargin={shouldRotateXTicks ? 10 : 6}
          />

          <YAxis
            tickFormatter={formatYAxis}
            label={{
              value: isSpeedMode ? '速度' : '配速',
              angle: -90,
              position: 'insideLeft',
              style: axisLabelStyle,
            }}
            tick={axisTick}
            axisLine={{ stroke: 'rgba(var(--color-separator))' }}
            tickLine={{ stroke: 'rgba(var(--color-separator))' }}
            domain={[Math.max(0, minMetricValue - padding), maxMetricValue + padding]}
            reversed={!isSpeedMode} // Invert pace so faster (lower pace) is at top
          />

          <Tooltip
            content={
              <CustomTooltip
                fastestKm={fastestSplit.kilometer}
                averagePace={averagePace}
                metric={metric}
              />
            }
            cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
          />

          {/* Average pace reference line */}
          <ReferenceLine
            y={isSpeedMode ? paceToSpeed(averagePace) : averagePace}
            stroke="rgba(var(--color-secondaryLabel))"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `平均 ${formatMetric(averagePace)}`,
              position: 'right',
              fill: 'rgba(var(--color-secondaryLabel))',
              fontSize: 11,
            }}
          />

          {/* Pace bars with color coding */}
          <Bar dataKey="metricValue" radius={[4, 4, 0, 0]} maxBarSize={40}>
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
          <span className="text-label/60">{isSpeedMode ? '更快' : '快 (>15秒)'}</span>
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
          <span className="text-label/60">{isSpeedMode ? '更慢' : '慢 (>20秒)'}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
