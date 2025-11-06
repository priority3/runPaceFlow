/**
 * Activity Table Component
 *
 * Clean, modern table design inspired by cyc.earth
 */

'use client'

import Link from 'next/link'

import { formatDuration } from '@/lib/pace/calculator'
import type { Activity } from '@/types/activity'

export interface ActivityTableProps {
  activities: Activity[]
  className?: string
}

export function ActivityTable({ activities, className = '' }: ActivityTableProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-fill rounded-3xl p-16 text-center">
        <p className="text-placeholder-text text-lg">还没有活动记录</p>
        <p className="text-placeholder-text/70 mt-2 text-sm">同步 Nike Run Club 数据后，活动将显示在这里</p>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-3xl border border-separator ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="bg-fill border-b border-separator">
            <th className="text-placeholder-text px-8 py-5 text-left text-sm font-medium">活动名称</th>
            <th className="text-placeholder-text px-8 py-5 text-right text-sm font-medium">距离</th>
            <th className="text-placeholder-text px-8 py-5 text-right text-sm font-medium">用时</th>
            <th className="text-placeholder-text px-8 py-5 text-right text-sm font-medium">爬升</th>
            <th className="text-placeholder-text px-8 py-5 text-right text-sm font-medium">日期</th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-separator/50">
          {activities.map((activity) => (
            <tr
              key={activity.id}
              className="hover:bg-fill/30 transition-colors"
            >
              <td className="px-8 py-5">
                <Link
                  href={`/activity/${activity.id}`}
                  className="text-text hover:text-link font-medium transition-colors"
                >
                  {activity.title || '跑步活动'}
                </Link>
              </td>
              <td className="text-text px-8 py-5 text-right font-mono text-sm">
                {(activity.distance / 1000).toFixed(2)} km
              </td>
              <td className="text-text px-8 py-5 text-right font-mono text-sm">
                {formatDuration(activity.duration)}
              </td>
              <td className="text-text px-8 py-5 text-right font-mono text-sm">
                {activity.elevationGain ? `${Math.round(activity.elevationGain)} m` : '-'}
              </td>
              <td className="text-text px-8 py-5 text-right text-sm">
                {new Date(activity.startTime).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
