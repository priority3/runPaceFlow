/**
 * SplitsTable Component
 *
 * Glassmorphic design with seamless depth transitions
 */

'use client'

import { formatDuration, formatPace } from '@/lib/pace/calculator'

import type { Split } from './PaceChart'

export interface SplitsTableProps {
  splits: Split[]
  className?: string
}

/**
 * Split data table with glassmorphic styling
 */
export function SplitsTable({ splits, className }: SplitsTableProps) {
  if (!splits || splits.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/20 bg-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
        <p className="text-label/50">暂无分段数据</p>
      </div>
    )
  }

  // Find fastest split
  const fastestSplit = splits.reduce((min, split) => (split.pace < min.pace ? split : min))

  // Calculate cumulative data
  const tableData = splits.reduce<
    Array<
      Split & {
        cumulativeDistance: number
        cumulativeTime: number
        isFastest: boolean
      }
    >
  >((acc, split, index) => {
    const prevData = acc[index - 1]
    const cumulativeDistance = (prevData?.cumulativeDistance || 0) + split.distance
    const cumulativeTime = (prevData?.cumulativeTime || 0) + split.duration

    acc.push({
      ...split,
      cumulativeDistance,
      cumulativeTime,
      isFastest: split.kilometer === fastestSplit.kilometer,
    })

    return acc
  }, [])

  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-xl border border-white/20 backdrop-blur-xl dark:border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/30 dark:bg-black/10">
              <th className="text-label/60 px-4 py-3 text-left text-xs font-medium">公里</th>
              <th className="text-label/60 px-4 py-3 text-right text-xs font-medium">配速</th>
              <th className="text-label/60 px-4 py-3 text-right text-xs font-medium">时长</th>
              <th className="text-label/60 hidden px-4 py-3 text-right text-xs font-medium sm:table-cell">
                累计距离
              </th>
              <th className="text-label/60 hidden px-4 py-3 text-right text-xs font-medium sm:table-cell">
                累计时间
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((data, index) => (
              <tr
                key={data.kilometer}
                className={`border-b border-white/10 transition-colors hover:bg-white/20 dark:hover:bg-white/5 ${
                  data.isFastest
                    ? 'bg-white/40 dark:bg-white/10'
                    : index % 2 === 0
                      ? 'bg-white/20 dark:bg-black/5'
                      : 'bg-white/10 dark:bg-transparent'
                }`}
              >
                {/* Kilometer */}
                <td className="text-label/80 px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <span>第 {data.kilometer} km</span>
                    {data.isFastest && (
                      <span className="rounded-full bg-gray-200/60 px-2 py-0.5 text-xs dark:bg-white/10">
                        最快
                      </span>
                    )}
                  </div>
                </td>

                {/* Pace */}
                <td className="text-label/80 px-4 py-3 text-right font-mono">
                  {formatPace(data.pace)}
                </td>

                {/* Duration */}
                <td className="text-label/60 px-4 py-3 text-right font-mono">
                  {formatDuration(data.duration)}
                </td>

                {/* Cumulative distance (desktop) */}
                <td className="text-label/50 hidden px-4 py-3 text-right font-mono sm:table-cell">
                  {(data.cumulativeDistance / 1000).toFixed(2)} km
                </td>

                {/* Cumulative time (desktop) */}
                <td className="text-label/50 hidden px-4 py-3 text-right font-mono sm:table-cell">
                  {formatDuration(data.cumulativeTime)}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Summary row */}
          <tfoot>
            <tr className="border-t border-white/20 bg-white/30 font-medium dark:bg-black/10">
              <td className="text-label/80 px-4 py-3">总计</td>
              <td className="text-label/80 px-4 py-3 text-right font-mono">
                {formatPace(splits.reduce((sum, s) => sum + s.pace, 0) / splits.length)}
              </td>
              <td className="text-label/80 px-4 py-3 text-right font-mono">
                {formatDuration(splits.reduce((sum, s) => sum + s.duration, 0))}
              </td>
              <td className="text-label/60 hidden px-4 py-3 text-right font-mono sm:table-cell">
                {(splits.reduce((sum, s) => sum + s.distance, 0) / 1000).toFixed(2)} km
              </td>
              <td className="text-label/60 hidden px-4 py-3 text-right font-mono sm:table-cell">
                {formatDuration(splits.reduce((sum, s) => sum + s.duration, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
