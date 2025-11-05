/**
 * PaceChart Component
 *
 * Displays pace analysis with line chart
 */

'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Dot,
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
 * 配速折线图组件
 * 显示每公里配速、平均配速参考线、最快配速标记
 */
export function PaceChart({ splits, averagePace, className }: PaceChartProps) {
  if (!splits || splits.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-separator bg-secondarySystemBackground">
        <p className="text-secondaryLabel">暂无配速数据</p>
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
  const fastestSplit = splits.reduce((min, split) =>
    split.pace < min.pace ? split : min,
  )

  // 自定义点样式（最快配速高亮）
  const customDot = (props: any) => {
    const { cx, cy, payload } = props
    const isFastest = payload.kilometer === fastestSplit.kilometer

    if (isFastest) {
      return (
        <g>
          {/* 外圈光晕 */}
          <circle cx={cx} cy={cy} r={8} fill="#22c55e" opacity={0.3} />
          {/* 内圈实心 */}
          <circle cx={cx} cy={cy} r={4} fill="#22c55e" stroke="#fff" strokeWidth={2} />
        </g>
      )
    }

    return <Dot {...props} r={3} />
  }

  // 格式化 Y 轴（配速）
  const formatYAxis = (value: number) => {
    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const isFastest = data.kilometer === fastestSplit.kilometer

      return (
        <div className="rounded-lg border border-separator bg-secondarySystemBackground/95 p-3 shadow-xl backdrop-blur-sm">
          <p className="mb-1 text-sm font-semibold text-label">
            第 {data.kilometer} 公里
            {isFastest && (
              <span className="ml-2 rounded bg-green/20 px-2 py-0.5 text-xs text-green">
                最快
              </span>
            )}
          </p>
          <p className="text-xs text-secondaryLabel">
            配速: <span className="font-mono text-label">{data.paceFormatted}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
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

          <Tooltip content={<CustomTooltip />} />

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
