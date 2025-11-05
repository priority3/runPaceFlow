/**
 * SplitsTable Component
 *
 * Displays split data in a table format
 */

'use client'

import { formatDuration, formatPace } from '@/lib/pace/calculator'

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
      <div className="border-separator bg-secondarySystemBackground flex min-h-[200px] items-center justify-center rounded-lg border">
        <p className="text-secondaryLabel">暂无分段数据</p>
      </div>
    )
  }

  // 找出最快配速
  const fastestSplit = splits.reduce((min, split) => (split.pace < min.pace ? split : min))

  // 计算累计数据 - 使用 reduce 避免变量重新赋值
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
      <div className="border-separator overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-separator bg-fill border-b">
              <th className="text-label px-4 py-3 text-left font-semibold">公里</th>
              <th className="text-label px-4 py-3 text-right font-semibold">配速</th>
              <th className="text-label px-4 py-3 text-right font-semibold">时长</th>
              <th className="text-label hidden px-4 py-3 text-right font-semibold sm:table-cell">累计距离</th>
              <th className="text-label hidden px-4 py-3 text-right font-semibold sm:table-cell">累计时间</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((data, index) => (
              <tr
                key={data.kilometer}
                className={`
                  border-separator hover:bg-fill/50 border-b transition-colors
                  ${data.isFastest ? 'bg-green/10' : index % 2 === 0 ? 'bg-secondarySystemBackground' : 'bg-tertiarySystemBackground'}
                `}
              >
                {/* 公里数 */}
                <td className="text-label px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <span>第 {data.kilometer} km</span>
                    {data.isFastest && <span className="bg-green/20 text-green rounded px-2 py-0.5 text-xs">最快</span>}
                  </div>
                </td>

                {/* 配速 */}
                <td className="text-label px-4 py-3 text-right font-mono">{formatPace(data.pace)}</td>

                {/* 时长 */}
                <td className="text-secondaryLabel px-4 py-3 text-right font-mono">{formatDuration(data.duration)}</td>

                {/* 累计距离（桌面端） */}
                <td className="text-secondaryLabel hidden px-4 py-3 text-right font-mono sm:table-cell">
                  {(data.cumulativeDistance / 1000).toFixed(2)} km
                </td>

                {/* 累计时间（桌面端） */}
                <td className="text-secondaryLabel hidden px-4 py-3 text-right font-mono sm:table-cell">
                  {formatDuration(data.cumulativeTime)}
                </td>
              </tr>
            ))}
          </tbody>

          {/* 总结行 */}
          <tfoot>
            <tr className="border-separator bg-fill border-t-2 font-semibold">
              <td className="text-label px-4 py-3">总计</td>
              <td className="text-label px-4 py-3 text-right font-mono">
                {formatPace(splits.reduce((sum, s) => sum + s.pace, 0) / splits.length)}
              </td>
              <td className="text-label px-4 py-3 text-right font-mono">
                {formatDuration(splits.reduce((sum, s) => sum + s.duration, 0))}
              </td>
              <td className="text-label hidden px-4 py-3 text-right font-mono sm:table-cell">
                {(splits.reduce((sum, s) => sum + s.distance, 0) / 1000).toFixed(2)} km
              </td>
              <td className="text-label hidden px-4 py-3 text-right font-mono sm:table-cell">
                {formatDuration(splits.reduce((sum, s) => sum + s.duration, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
