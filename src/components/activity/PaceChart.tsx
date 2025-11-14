/**
 * PaceChart Component
 *
 * Displays pace analysis with line chart
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

// 自定义 Tooltip 组件 - 在组件外部定义避免重复创建
const CustomTooltip = ({ active, payload, fastestKm }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload
    const isFastest = data.kilometer === fastestKm

    return (
      <div className="border-separator bg-secondary-system-background/95 rounded-lg border p-3 shadow-xl backdrop-blur-sm">
        <p className="text-label mb-1 text-sm font-semibold">
          第 {data.kilometer} 公里
          {isFastest && (
            <span className="bg-green/20 text-green ml-2 rounded px-2 py-0.5 text-xs">最快</span>
          )}
        </p>
        <p className="text-secondary-label text-xs">
          配速: <span className="text-label font-mono">{data.paceFormatted}</span>
        </p>
      </div>
    )
  }
  return null
}

/**
 * 配速折线图组件
 * 显示每公里配速、平均配速参考线、最快配速标记
 */
export function PaceChart({ splits, averagePace, className }: PaceChartProps) {
  if (!splits || splits.length === 0) {
    return (
      <div className="border-separator bg-secondary-system-background flex h-[300px] items-center justify-center rounded-lg border">
        <p className="text-secondary-label">暂无配速数据</p>
      </div>
    )
  }

  // 准备图表数据
  const chartData = splits.map((split) => ({
    kilometer: split.kilometer,
    pace: split.pace,
    paceFormatted: formatPace(split.pace),
  }))

  // 找出最快配速
  const fastestSplit = splits.reduce((min, split) => (split.pace < min.pace ? split : min))

  // 自定义点样式（最快配速高亮）
  const customDot = (props: any) => {
    const { cx, cy, payload, key, ...rest } = props
    const isFastest = payload.kilometer === fastestSplit.kilometer

    if (isFastest) {
      return (
        <g key={key}>
          {/* 外圈光晕 */}
          <circle cx={cx} cy={cy} r={8} fill="#22c55e" opacity={0.3} />
          {/* 内圈实心 */}
          <circle cx={cx} cy={cy} r={4} fill="#22c55e" stroke="#fff" strokeWidth={2} />
        </g>
      )
    }

    return <Dot key={key} {...rest} r={3} />
  }

  // 格式化 Y 轴（配速）
  const formatYAxis = (value: number) => {
    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--separator))" opacity={0.5} />

          <XAxis
            dataKey="kilometer"
            label={{ value: '公里', position: 'insideBottom', offset: -5 }}
            tick={{ fill: 'hsl(var(--secondary-label))' }}
            axisLine={{ stroke: 'hsl(var(--separator))' }}
          />

          <YAxis
            tickFormatter={formatYAxis}
            label={{ value: '配速', angle: -90, position: 'insideLeft' }}
            tick={{ fill: 'hsl(var(--secondary-label))' }}
            axisLine={{ stroke: 'hsl(var(--separator))' }}
            domain={['dataMin - 10', 'dataMax + 10']}
          />

          <Tooltip content={<CustomTooltip fastestKm={fastestSplit.kilometer} />} />

          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => (
              <span style={{ color: 'hsl(var(--secondary-label))' }}>{value}</span>
            )}
          />

          {/* 平均配速参考线 */}
          <ReferenceLine
            y={averagePace}
            stroke="hsl(var(--blue))"
            strokeDasharray="5 5"
            label={{
              value: `平均 ${formatPace(averagePace)}`,
              position: 'right',
              fill: 'hsl(var(--blue))',
              fontSize: 12,
            }}
          />

          {/* 配速折线 */}
          <Line
            type="monotone"
            dataKey="pace"
            stroke="hsl(var(--blue))"
            strokeWidth={2}
            dot={customDot}
            activeDot={{ r: 6 }}
            name="配速"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
