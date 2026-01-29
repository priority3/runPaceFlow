/**
 * ActivityHeatmap Component
 *
 * GitHub-style contribution heatmap for running activities
 */

'use client'

import { useMemo } from 'react'

import { cn } from '@/lib/utils'
import type { Activity } from '@/types/activity'

export interface ActivityHeatmapProps {
  activities: Activity[]
  className?: string
}

/**
 * Get color intensity based on distance
 */
function getIntensityColor(distance: number): string {
  if (distance === 0) return 'bg-black/5 dark:bg-white/5'
  if (distance < 3000) return 'bg-green/20'
  if (distance < 5000) return 'bg-green/40'
  if (distance < 8000) return 'bg-green/60'
  if (distance < 10000) return 'bg-green/80'
  return 'bg-green'
}

/**
 * Generate calendar data for the last 12 weeks
 */
function generateCalendarData(activities: Activity[]): {
  weeks: { date: Date; distance: number; count: number }[][]
  monthLabels: { label: string; weekIndex: number }[]
} {
  const today = new Date()
  const weeks: { date: Date; distance: number; count: number }[][] = []
  const monthLabels: { label: string; weekIndex: number }[] = []

  // Create a map of date -> total distance
  const activityMap = new Map<string, { distance: number; count: number }>()
  for (const activity of activities) {
    const dateKey = new Date(activity.startTime).toISOString().split('T')[0]
    const existing = activityMap.get(dateKey) || { distance: 0, count: 0 }
    activityMap.set(dateKey, {
      distance: existing.distance + activity.distance,
      count: existing.count + 1,
    })
  }

  // Generate 12 weeks of data (84 days)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 83) // Go back 83 days (12 weeks - 1 day)

  // Adjust to start from Sunday
  const dayOfWeek = startDate.getDay()
  startDate.setDate(startDate.getDate() - dayOfWeek)

  let currentMonth = -1
  for (let week = 0; week < 12; week++) {
    const weekData: { date: Date; distance: number; count: number }[] = []

    for (let day = 0; day < 7; day++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + week * 7 + day)

      const dateKey = date.toISOString().split('T')[0]
      const data = activityMap.get(dateKey) || { distance: 0, count: 0 }

      weekData.push({
        date,
        distance: data.distance,
        count: data.count,
      })

      // Track month labels
      if (date.getMonth() !== currentMonth && date <= today) {
        currentMonth = date.getMonth()
        const monthNames = [
          '1月',
          '2月',
          '3月',
          '4月',
          '5月',
          '6月',
          '7月',
          '8月',
          '9月',
          '10月',
          '11月',
          '12月',
        ]
        monthLabels.push({ label: monthNames[currentMonth], weekIndex: week })
      }
    }

    weeks.push(weekData)
  }

  return { weeks, monthLabels }
}

export function ActivityHeatmap({ activities, className }: ActivityHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => generateCalendarData(activities), [activities])

  const today = new Date()
  const todayKey = today.toISOString().split('T')[0]

  // Calculate total stats for the period
  const totalDistance = useMemo(() => {
    return weeks.flat().reduce((sum, day) => sum + day.distance, 0)
  }, [weeks])

  const totalActivities = useMemo(() => {
    return weeks.flat().reduce((sum, day) => sum + day.count, 0)
  }, [weeks])

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/20 bg-white/50 p-4 backdrop-blur-xl sm:p-5 dark:border-white/10 dark:bg-black/20',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-label text-sm font-medium">跑步热力图</h3>
        <span className="text-label/50 text-xs">
          近12周 · {totalActivities} 次 · {(totalDistance / 1000).toFixed(1)} km
        </span>
      </div>

      {/* Calendar grid */}
      <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
        <div className="min-w-[520px] sm:min-w-[600px]">
          {/* Month labels */}
          <div className="mb-1 flex pl-8">
            {monthLabels.map(({ label, weekIndex }, i) => (
              <span
                key={`${label}-${i}`}
                className="text-label/40 text-xs"
                style={{
                  marginLeft:
                    i === 0 ? weekIndex * 14 : (weekIndex - monthLabels[i - 1].weekIndex) * 14 - 20,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid with day labels */}
          <div className="flex">
            {/* Day labels */}
            <div className="mr-2 flex flex-col justify-between py-0.5">
              {dayLabels.map((label, i) => (
                <span key={label} className="text-label/40 h-3 text-xs leading-3">
                  {i % 2 === 1 ? label : ''}
                </span>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-0.5">
              {weeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="flex flex-col gap-0.5">
                  {week.map((day) => {
                    const dateKey = day.date.toISOString().split('T')[0]
                    const isToday = dateKey === todayKey
                    const isFuture = day.date > today

                    return (
                      <div
                        key={dateKey}
                        className={cn(
                          'h-3 w-3 rounded-sm transition-colors',
                          isFuture ? 'bg-transparent' : getIntensityColor(day.distance),
                          isToday && 'ring-blue ring-1 ring-offset-1',
                        )}
                        title={
                          isFuture
                            ? ''
                            : `${day.date.toLocaleDateString('zh-CN')}: ${day.count > 0 ? `${day.count}次, ${(day.distance / 1000).toFixed(1)}km` : '无活动'}`
                        }
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-1 text-xs">
        <span className="text-label/40 mr-1">少</span>
        <div className="h-3 w-3 rounded-sm bg-black/5 dark:bg-white/5" />
        <div className="bg-green/20 h-3 w-3 rounded-sm" />
        <div className="bg-green/40 h-3 w-3 rounded-sm" />
        <div className="bg-green/60 h-3 w-3 rounded-sm" />
        <div className="bg-green/80 h-3 w-3 rounded-sm" />
        <div className="bg-green h-3 w-3 rounded-sm" />
        <span className="text-label/40 ml-1">多</span>
      </div>
    </div>
  )
}
