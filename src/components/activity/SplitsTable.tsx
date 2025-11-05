/**
 * SplitsTable Component
 *
 * Displays split data in a table format
 */

'use client'

import { formatPace, formatDuration } from '@/lib/pace/calculator'
import type { Split } from './PaceChart'

export interface SplitsTableProps {
  splits: Split[]
  className?: string
}

/**
 * 分段数据表格组件
 * 显示每公里的详细数据
 */
export function SplitsTable({ splits, className }: SplitsTableProps) {
  if (!splits || splits.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-separator bg-secondarySystemBackground">
        <p className="text-secondaryLabel">暂无分段数据</p>
      </div>
    )
  }

  // 找出最快配速
  const fastestSplit = splits.reduce((min, split) =>
    split.pace < min.pace ? split : min,
  )

  // 计算累计数据
  let cumulativeDistance = 0
  let cumulativeTime = 0

  const tableData = splits.map((split) => {
    cumulativeDistance += split.distance
    cumulativeTime += split.duration

    return {
      ...split,
      cumulativeDistance,
      cumulativeTime,
      isFastest: split.kilometer === fastestSplit.kilometer,
    }
  })

  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-lg border border-separator">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-separator bg-fill">
              <th className="px-4 py-3 text-left font-semibold text-label">公里</th>
              <th className="px-4 py-3 text-right font-semibold text-label">配速</th>
              <th className="px-4 py-3 text-right font-semibold text-label">时长</th>
              <th className="hidden px-4 py-3 text-right font-semibold text-label sm:table-cell">
                累计距离
              </th>
              <th className="hidden px-4 py-3 text-right font-semibold text-label sm:table-cell">
                累计时间
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((data, index) => (
              <tr
                key={data.kilometer}
                className={`
                  border-b border-separator transition-colors hover:bg-fill/50
                  ${data.isFastest ? 'bg-green/10' : index % 2 === 0 ? 'bg-secondarySystemBackground' : 'bg-tertiarySystemBackground'}
                `}
              >
                {/* 公里数 */}
                <td className="px-4 py-3 font-medium text-label">
                  <div className="flex items-center gap-2">
                    <span>第 {data.kilometer} km</span>
                    {data.isFastest && (
                      <span className="rounded bg-green/20 px-2 py-0.5 text-xs text-green">
                        最快
                      </span>
                    )}
                  </div>
                </td>

                {/* 配速 */}
                <td className="px-4 py-3 text-right font-mono text-label">
                  {formatPace(data.pace)}
                </td>

                {/* 时长 */}
                <td className="px-4 py-3 text-right font-mono text-secondaryLabel">
                  {formatDuration(data.duration)}
                </td>

                {/* 累计距离（桌面端） */}
                <td className="hidden px-4 py-3 text-right font-mono text-secondaryLabel sm:table-cell">
                  {(data.cumulativeDistance / 1000).toFixed(2)} km
                </td>

                {/* 累计时间（桌面端） */}
                <td className="hidden px-4 py-3 text-right font-mono text-secondaryLabel sm:table-cell">
                  {formatDuration(data.cumulativeTime)}
                </td>
              </tr>
            ))}
          </tbody>

          {/* 总结行 */}
          <tfoot>
            <tr className="border-t-2 border-separator bg-fill font-semibold">
              <td className="px-4 py-3 text-label">总计</td>
              <td className="px-4 py-3 text-right font-mono text-label">
                {formatPace(
                  splits.reduce((sum, s) => sum + s.pace, 0) / splits.length,
                )}
              </td>
              <td className="px-4 py-3 text-right font-mono text-label">
                {formatDuration(
                  splits.reduce((sum, s) => sum + s.duration, 0),
                )}
              </td>
              <td className="hidden px-4 py-3 text-right font-mono text-label sm:table-cell">
                {(splits.reduce((sum, s) => sum + s.distance, 0) / 1000).toFixed(2)} km
              </td>
              <td className="hidden px-4 py-3 text-right font-mono text-label sm:table-cell">
                {formatDuration(
                  splits.reduce((sum, s) => sum + s.duration, 0),
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
