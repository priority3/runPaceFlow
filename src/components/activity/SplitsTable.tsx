/**
 * SplitsTable — km rows with shared selection + playback current row.
 */

'use client'

import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'

import { calculateSpeed, formatDuration, formatPace } from '@/lib/pace/calculator'
import { cn } from '@/lib/utils'
import { selectedKilometerAtom } from '@/stores/map'

import type { Split } from './PaceChart'

type MetricMode = 'pace' | 'speed'

export interface SplitsTableProps {
  splits: Split[]
  className?: string
  metric?: MetricMode
  /** Km under playback head */
  activeKilometer?: number | null
  onSelectKilometer?: (kilometer: number) => void
}

export function SplitsTable({
  splits,
  className,
  metric = 'pace',
  activeKilometer = null,
  onSelectKilometer,
}: SplitsTableProps) {
  const [selectedKm, setSelectedKm] = useAtom(selectedKilometerAtom)
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())

  // Reason: only auto-scroll on explicit user selection.
  // Following playback head (activeKilometer) would hijack the page viewport every km.
  useEffect(() => {
    if (selectedKm == null) return
    const row = rowRefs.current.get(selectedKm)
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedKm])

  if (!splits || splits.length === 0) {
    return (
      <div className="bg-secondary-system-background flex min-h-[200px] items-center justify-center rounded-lg">
        <p className="text-label/50">暂无分段数据</p>
      </div>
    )
  }

  const fastestSplit = splits.reduce((min, split) => (split.pace < min.pace ? split : min))

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

  const totalDistance = splits.reduce((sum, s) => sum + s.distance, 0)
  const totalDuration = splits.reduce((sum, s) => sum + s.duration, 0)
  const avgPace = splits.reduce((sum, s) => sum + s.pace, 0) / splits.length
  const isSpeedMode = metric === 'speed'
  const metricLabel = isSpeedMode ? '速度' : '配速'
  const summaryMetric = isSpeedMode
    ? `${calculateSpeed(totalDistance, totalDuration).toFixed(1)} km/h`
    : `${formatPace(avgPace)}/km`
  const formatSplitMetric = (split: Split) =>
    isSpeedMode
      ? `${calculateSpeed(split.distance, split.duration).toFixed(1)} km/h`
      : `${formatPace(split.pace)}/km`

  const colGroup = (
    <colgroup>
      <col className="w-[30%] sm:w-[20%]" />
      <col className="w-[35%] sm:w-[20%]" />
      <col className="w-[35%] sm:w-[20%]" />
      <col className="hidden w-[20%] sm:table-column" />
      <col className="hidden w-[20%] sm:table-column" />
    </colgroup>
  )

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-xl ring-1 ring-[rgb(var(--color-separator))]">
        <div className="scrollbar-subtle max-h-[400px] overflow-y-auto sm:max-h-[500px]">
          <table className="w-full table-fixed text-sm">
            {colGroup}
            <thead className="sticky top-0 z-10">
              <tr className="bg-secondary-system-background/90 backdrop-blur-sm">
                <th className="text-tertiary-label px-4 py-2.5 text-left text-[11px] font-medium tracking-wide uppercase">
                  公里
                </th>
                <th className="text-tertiary-label px-4 py-2.5 text-right text-[11px] font-medium tracking-wide uppercase">
                  {metricLabel}
                </th>
                <th className="text-tertiary-label px-4 py-2.5 text-right text-[11px] font-medium tracking-wide uppercase">
                  时长
                </th>
                <th className="text-tertiary-label hidden px-4 py-2.5 text-right text-[11px] font-medium tracking-wide uppercase sm:table-cell">
                  累计距离
                </th>
                <th className="text-tertiary-label hidden px-4 py-2.5 text-right text-[11px] font-medium tracking-wide uppercase sm:table-cell">
                  累计时间
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((data, index) => {
                const selected = selectedKm === data.kilometer
                const active = activeKilometer === data.kilometer
                return (
                  <tr
                    key={data.kilometer}
                    ref={(node) => {
                      if (node) rowRefs.current.set(data.kilometer, node)
                      else rowRefs.current.delete(data.kilometer)
                    }}
                    onClick={() => {
                      const next = selected ? null : data.kilometer
                      setSelectedKm(next)
                      if (next !== null) onSelectKilometer?.(next)
                    }}
                    className={cn(
                      'border-separator/60 cursor-pointer border-t transition-colors',
                      selected
                        ? 'bg-accent/12'
                        : active
                          ? 'bg-accent/8'
                          : data.isFastest
                            ? 'bg-accent/6'
                            : index % 2 === 0
                              ? 'bg-secondary-system-background/30'
                              : 'bg-transparent',
                      'hover:bg-secondary-system-background/80',
                    )}
                  >
                    <td className="text-secondary-label px-4 py-2.5 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex h-1.5 w-1.5 rounded-full',
                            selected || active ? 'bg-accent' : 'bg-transparent',
                          )}
                          aria-hidden="true"
                        />
                        <span className="tabular-nums">{data.kilometer}</span>
                        {data.isFastest && (
                          <span className="bg-accent/12 text-accent rounded-full px-1.5 py-0.5 text-[10px]">
                            最快
                          </span>
                        )}
                        {active && !selected && (
                          <span className="text-tertiary-label text-[10px]">回放</span>
                        )}
                      </div>
                    </td>
                    <td className="font-data text-label px-4 py-2.5 text-right text-[13px] whitespace-nowrap tabular-nums">
                      {formatSplitMetric(data)}
                    </td>
                    <td className="font-data text-secondary-label px-4 py-2.5 text-right text-[13px] whitespace-nowrap tabular-nums">
                      {formatDuration(data.duration)}
                    </td>
                    <td className="font-data text-tertiary-label hidden px-4 py-2.5 text-right text-[13px] whitespace-nowrap tabular-nums sm:table-cell">
                      {(data.cumulativeDistance / 1000).toFixed(2)} km
                    </td>
                    <td className="font-data text-tertiary-label hidden px-4 py-2.5 text-right text-[13px] whitespace-nowrap tabular-nums sm:table-cell">
                      {formatDuration(data.cumulativeTime)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-secondary-system-background/80 border-separator border-t">
          <table className="w-full text-sm">
            {colGroup}
            <tfoot>
              <tr className="font-medium">
                <td className="text-secondary-label px-4 py-2.5 text-[12px]">总计</td>
                <td className="font-data text-label px-4 py-2.5 text-right text-[13px] whitespace-nowrap tabular-nums">
                  {summaryMetric}
                </td>
                <td className="font-data text-label px-4 py-2.5 text-right text-[13px] whitespace-nowrap tabular-nums">
                  {formatDuration(totalDuration)}
                </td>
                <td className="font-data text-secondary-label hidden px-4 py-2.5 text-right text-[13px] whitespace-nowrap tabular-nums sm:table-cell">
                  {(totalDistance / 1000).toFixed(2)} km
                </td>
                <td className="font-data text-secondary-label hidden px-4 py-2.5 text-right text-[13px] whitespace-nowrap tabular-nums sm:table-cell">
                  {formatDuration(totalDuration)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
