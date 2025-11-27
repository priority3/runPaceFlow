/**
 * PaceChart Component
 *
 * Glassmorphic design with subtle color gradation
 */

'use client'

import {
  CartesianGrid,
  Dot,
  Legend,
  Line,
  LineChart,
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

// Custom Tooltip component - glassmorphic style
const CustomTooltip = ({ active, payload, fastestKm }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload
    const isFastest = data.kilometer === fastestKm

    return (
      <div className="rounded-xl border border-white/30 bg-white/80 p-3 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-black/60">
        <p className="text-label mb-1 text-sm font-medium">
          第 {data.kilometer} 公里
          {isFastest && (
            <span className="ml-2 rounded-full bg-gray-200/60 px-2 py-0.5 text-xs dark:bg-white/10">
              最快
            </span>
          )}
        </p>
        <p className="text-label/60 text-xs">
          配速: <span className="text-label/80 font-mono">{data.paceFormatted}</span>
        </p>
      </div>
    )
  }
  return null
}

/**
 * Pace line chart component with glassmorphic styling
 */
export function PaceChart({ splits, averagePace, className }: PaceChartProps) {
  if (!splits || splits.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-white/20 bg-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
        <p className="text-label/50">暂无配速数据</p>
      </div>
    )
  }

  // Prepare chart data
  const chartData = splits.map((split) => ({
    kilometer: split.kilometer,
    pace: split.pace,
    paceFormatted: formatPace(split.pace),
  }))

  // Find fastest split
  const fastestSplit = splits.reduce((min, split) => (split.pace < min.pace ? split : min))

  // Custom dot style (highlight fastest)
  const customDot = (props: any) => {
    const { cx, cy, payload, key, ...rest } = props
    const isFastest = payload.kilometer === fastestSplit.kilometer

    if (isFastest) {
      return (
        <g key={key}>
          {/* Outer glow */}
          <circle cx={cx} cy={cy} r={8} fill="rgba(107, 114, 128, 0.3)" />
          {/* Inner solid */}
          <circle cx={cx} cy={cy} r={4} fill="#6b7280" stroke="#fff" strokeWidth={2} />
        </g>
      )
    }

    return <Dot key={key} {...rest} r={3} fill="rgba(107, 114, 128, 0.6)" />
  }

  // Format Y axis (pace)
  const formatYAxis = (value: number) => {
    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />

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
            domain={['dataMin - 10', 'dataMax + 10']}
          />

          <Tooltip content={<CustomTooltip fastestKm={fastestSplit.kilometer} />} />

          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={() => <span style={{ color: 'rgba(107, 114, 128, 0.8)' }}>配速</span>}
          />

          {/* Average pace reference line */}
          <ReferenceLine
            y={averagePace}
            stroke="rgba(107, 114, 128, 0.5)"
            strokeDasharray="5 5"
            label={{
              value: `平均 ${formatPace(averagePace)}`,
              position: 'right',
              fill: 'rgba(107, 114, 128, 0.6)',
              fontSize: 11,
            }}
          />

          {/* Pace line */}
          <Line
            type="monotone"
            dataKey="pace"
            stroke="rgba(107, 114, 128, 0.7)"
            strokeWidth={2}
            dot={customDot}
            activeDot={{ r: 6, fill: '#6b7280' }}
            name="配速"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
