/**
 * PaceChart — color-coded km bars with shared kilometer selection.
 */

'use client'

import { useAtom } from 'jotai'
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
import { PACE_COLOR_VARS } from '@/lib/theme/palette'
import { selectedKilometerAtom } from '@/stores/map'

type MetricMode = 'pace' | 'speed'

export interface Split {
  kilometer: number
  pace: number
  distance: number
  duration: number
}

export interface PaceChartProps {
  splits: Split[]
  averagePace: number
  className?: string
  metric?: MetricMode
  activeKilometer?: number | null
  onSelectKilometer?: (kilometer: number) => void
}

function getPaceBarColor(pace: number, averagePace: number): string {
  const diff = pace - averagePace
  if (diff < -20) return PACE_COLOR_VARS.veryFast
  if (diff < -5) return PACE_COLOR_VARS.fast
  if (diff < 8) return PACE_COLOR_VARS.average
  if (diff < 20) return PACE_COLOR_VARS.slow
  return PACE_COLOR_VARS.verySlow
}

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
      <div className="surface-glass rounded-xl px-3.5 py-2.5">
        <p className="text-secondary-label mb-1 text-xs font-medium">
          第 {data.kilometer} 公里
          {isFastest && (
            <span className="bg-accent/15 text-accent ml-2 rounded-full px-2 py-0.5 text-[10px]">
              最快
            </span>
          )}
        </p>
        <p className="font-data text-label text-base font-medium tabular-nums">
          {data.metricFormatted}
        </p>
        <p className="text-tertiary-label mt-0.5 text-[11px]">vs 平均: {diffText}</p>
      </div>
    )
  }
  return null
}

export function PaceChart({
  splits,
  averagePace,
  className,
  metric = 'pace',
  activeKilometer = null,
  onSelectKilometer,
}: PaceChartProps) {
  const [selectedKm, setSelectedKm] = useAtom(selectedKilometerAtom)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const emptyText = metric === 'speed' ? '暂无速度数据' : '暂无配速数据'

  if (!splits || splits.length === 0) {
    return (
      <div className="bg-secondary-system-background flex h-[300px] items-center justify-center rounded-lg">
        <p className="text-label/50">{emptyText}</p>
      </div>
    )
  }

  if (!isMounted) {
    return <div className="skeleton-shimmer h-[280px] rounded-xl" />
  }

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

  const fastestSplit = splits.reduce((min, split) => (split.pace < min.pace ? split : min))

  const formatYAxis = (value: number) => {
    if (isSpeedMode) return value.toFixed(1)
    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const metricValues = chartData.map((item) => item.metricValue)
  const minMetricValue = Math.min(...metricValues)
  const maxMetricValue = Math.max(...metricValues)
  const padding = isSpeedMode ? 1 : 15
  const shouldRotateXTicks = splits.length > 16
  const focusKm = selectedKm ?? activeKilometer

  const axisTick = {
    fill: 'rgba(var(--color-tertiaryLabel))',
    fontSize: 11,
    fontWeight: 400,
  }

  const handleBarClick = (state: any) => {
    const km = state?.activePayload?.[0]?.payload?.kilometer as number | undefined
    if (km == null) return
    const next = selectedKm === km ? null : km
    setSelectedKm(next)
    if (next !== null) onSelectKilometer?.(next)
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 24, left: 4, bottom: shouldRotateXTicks ? 22 : 8 }}
          barCategoryGap="28%"
          onClick={handleBarClick}
        >
          <CartesianGrid
            strokeDasharray="2 6"
            stroke="rgba(var(--color-separator))"
            vertical={false}
          />
          <XAxis
            dataKey="kilometer"
            interval={0}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            angle={shouldRotateXTicks ? -45 : 0}
            textAnchor={shouldRotateXTicks ? 'end' : 'middle'}
            height={shouldRotateXTicks ? 44 : undefined}
            tickMargin={shouldRotateXTicks ? 10 : 8}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={[Math.max(0, minMetricValue - padding), maxMetricValue + padding]}
            reversed={!isSpeedMode}
          />
          <Tooltip
            content={
              <CustomTooltip
                fastestKm={fastestSplit.kilometer}
                averagePace={averagePace}
                metric={metric}
              />
            }
            cursor={{ fill: 'rgba(var(--color-quaternarySystemFill))' }}
          />
          <ReferenceLine
            y={isSpeedMode ? paceToSpeed(averagePace) : averagePace}
            stroke="var(--rpf-pace-average)"
            strokeDasharray="4 6"
            strokeWidth={1.25}
            strokeOpacity={0.85}
            label={{
              value: `均 ${formatMetric(averagePace)}`,
              position: 'insideTopRight',
              fill: 'var(--rpf-pace-average)',
              fontSize: 11,
            }}
          />
          <Bar dataKey="metricValue" radius={[6, 6, 2, 2]} maxBarSize={36} cursor="pointer">
            {chartData.map((entry) => {
              const focused = focusKm === entry.kilometer
              const dimmed = focusKm != null && !focused
              return (
                <Cell
                  key={`cell-${entry.kilometer}`}
                  fill={entry.color}
                  fillOpacity={
                    focused
                      ? 0.95
                      : dimmed
                        ? 0.22
                        : entry.kilometer === fastestSplit.kilometer
                          ? 0.82
                          : 0.68
                  }
                  stroke={focused ? entry.color : 'none'}
                  strokeWidth={focused ? 2 : 0}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <motion.div
        className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[var(--rpf-pace-very-fast)]" />
          <span className="text-tertiary-label">{isSpeedMode ? '更快' : '快'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[var(--rpf-pace-fast)]" />
          <span className="text-tertiary-label">较快</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[var(--rpf-pace-average)]" />
          <span className="text-tertiary-label">平均</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[var(--rpf-pace-slow)]" />
          <span className="text-tertiary-label">较慢</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[var(--rpf-pace-very-slow)]" />
          <span className="text-tertiary-label">{isSpeedMode ? '更慢' : '慢'}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
