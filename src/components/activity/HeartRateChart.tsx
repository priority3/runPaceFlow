/**
 * HeartRateChart Component
 *
 * Line chart showing heart rate variation over time/distance
 * Color-coded by heart rate zones
 */

'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface HeartRatePoint {
  distance: number // meters
  heartRate: number // bpm
  time?: Date
}

export interface HeartRateChartProps {
  data: HeartRatePoint[]
  averageHeartRate?: number
  maxHeartRate?: number
  className?: string
}

/**
 * Get zone name based on heart rate
 */
function getZoneName(hr: number, maxHR: number): string {
  const percentage = (hr / maxHR) * 100

  if (percentage < 60) return 'Z1 恢复'
  if (percentage < 70) return 'Z2 有氧'
  if (percentage < 80) return 'Z3 有氧耐力'
  if (percentage < 90) return 'Z4 乳酸阈值'
  return 'Z5 无氧'
}

// Custom Tooltip component
const CustomTooltip = ({ active, payload, maxHR }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload
    const hr = data.heartRate
    const zoneName = maxHR ? getZoneName(hr, maxHR) : ''
    const percentage = maxHR ? Math.round((hr / maxHR) * 100) : 0

    return (
      <div className="surface-glass rounded-xl px-3.5 py-2.5">
        <p className="text-secondary-label mb-1 text-xs font-medium">
          {(data.distance / 1000).toFixed(2)} km
        </p>
        <p className="font-data text-red text-base font-medium tabular-nums">{hr} bpm</p>
        {maxHR && (
          <p className="text-tertiary-label mt-0.5 text-[11px]">
            {zoneName} · {percentage}% 最大心率
          </p>
        )}
      </div>
    )
  }
  return null
}

/**
 * Heart rate line chart component
 */
export function HeartRateChart({
  data,
  averageHeartRate,
  maxHeartRate,
  className,
}: HeartRateChartProps) {
  // Prevent SSR hydration mismatch with ResponsiveContainer
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  if (!data || data.length === 0) {
    return (
      <div className="bg-secondary-system-background flex h-[250px] items-center justify-center rounded-lg">
        <p className="text-label/50">暂无心率数据</p>
      </div>
    )
  }

  // Show placeholder during SSR
  if (!isMounted) {
    return <div className="skeleton-shimmer h-[240px] rounded-xl" />
  }

  // Prepare chart data - sample every N points to avoid too many data points
  const sampleRate = Math.max(1, Math.floor(data.length / 200))
  const chartData = data
    .filter((_, index) => index % sampleRate === 0)
    .map((point) => ({
      distance: point.distance,
      distanceKm: (point.distance / 1000).toFixed(2),
      heartRate: point.heartRate,
    }))

  // Calculate stats
  const minHR = Math.min(...data.map((d) => d.heartRate))
  const maxHR = Math.max(...data.map((d) => d.heartRate))
  const effectiveMaxHR = maxHeartRate || maxHR

  // Format X axis (distance in km)
  const formatXAxis = (value: number) => {
    return `${(value / 1000).toFixed(1)}`
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 8, right: 24, left: 4, bottom: 8 }}>
          <defs>
            <linearGradient id="heartRateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--rpf-heart)" stopOpacity={0.14} />
              <stop offset="95%" stopColor="var(--rpf-heart)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="2 6"
            stroke="rgba(var(--color-separator))"
            vertical={false}
          />

          <XAxis
            dataKey="distance"
            tickFormatter={formatXAxis}
            tick={{ fill: 'rgba(var(--color-tertiaryLabel))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />

          <YAxis
            domain={[Math.max(60, minHR - 10), maxHR + 10]}
            tick={{ fill: 'rgba(var(--color-tertiaryLabel))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />

          <Tooltip content={<CustomTooltip maxHR={effectiveMaxHR} />} />

          {averageHeartRate && (
            <ReferenceLine
              y={averageHeartRate}
              stroke="var(--rpf-heart)"
              strokeDasharray="4 6"
              strokeWidth={1.5}
              strokeOpacity={0.75}
              label={{
                value: `均 ${averageHeartRate}`,
                position: 'insideTopRight',
                fill: 'var(--rpf-heart)',
                fontSize: 11,
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="heartRate"
            stroke="var(--rpf-heart)"
            strokeWidth={1.5}
            fill="url(#heartRateGradient)"
            dot={false}
            activeDot={{
              r: 3.5,
              fill: 'var(--rpf-heart)',
              stroke: 'rgb(var(--color-tertiarySystemBackground))',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <motion.div
        className="mt-3 flex flex-wrap items-center justify-center gap-5 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-tertiary-label">最低</span>
          <span className="font-data text-label font-medium tabular-nums">{minHR}</span>
        </div>
        {averageHeartRate && (
          <div className="flex items-center gap-1.5">
            <span className="text-tertiary-label">平均</span>
            <span className="font-data text-red font-medium tabular-nums">{averageHeartRate}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-tertiary-label">最高</span>
          <span className="font-data text-label font-medium tabular-nums">{maxHR}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
