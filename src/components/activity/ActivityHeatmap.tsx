/**
 * ActivityHeatmap Component
 *
 * GitHub-style contribution heatmap for running activities
 * Features: Click interaction with Popover, streak statistics
 */

'use client'

import * as Popover from '@radix-ui/react-popover'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Trophy, X } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import type { Activity } from '@/types/activity'

export interface ActivityHeatmapProps {
  activities: Activity[]
  className?: string
  /** Callback when a day with activities is clicked */
  onDayClick?: (date: Date, activities: Activity[]) => void
}

interface DayData {
  date: Date
  distance: number
  count: number
  activities: Activity[]
}

interface StreakData {
  current: number
  longest: number
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
 * Calculate current and longest running streaks
 */
function calculateStreaks(activities: Activity[]): StreakData {
  if (activities.length === 0) return { current: 0, longest: 0 }

  // Create a set of dates with activities
  const activityDates = new Set<string>()
  for (const activity of activities) {
    const dateKey = new Date(activity.startTime).toISOString().split('T')[0]
    activityDates.add(dateKey)
  }

  // Calculate current streak (counting back from today or yesterday)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = today.toISOString().split('T')[0]

  let currentStreak = 0
  const checkDate = new Date(today)

  // If no activity today, start from yesterday
  if (!activityDates.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  while (activityDates.has(checkDate.toISOString().split('T')[0])) {
    currentStreak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  // Calculate longest streak by iterating through all dates
  const sortedDates = Array.from(activityDates).sort()
  let longestStreak = 0
  let tempStreak = 1

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1])
    const currDate = new Date(sortedDates[i])
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  return { current: currentStreak, longest: longestStreak }
}

/**
 * Generate calendar data for the last 12 weeks
 */
function generateCalendarData(activities: Activity[]): {
  weeks: DayData[][]
  monthLabels: { label: string; weekIndex: number }[]
} {
  const today = new Date()
  const weeks: DayData[][] = []
  const monthLabels: { label: string; weekIndex: number }[] = []

  // Create a map of date -> activities data
  const activityMap = new Map<string, { distance: number; count: number; activities: Activity[] }>()
  for (const activity of activities) {
    const dateKey = new Date(activity.startTime).toISOString().split('T')[0]
    const existing = activityMap.get(dateKey) || { distance: 0, count: 0, activities: [] }
    activityMap.set(dateKey, {
      distance: existing.distance + activity.distance,
      count: existing.count + 1,
      activities: [...existing.activities, activity],
    })
  }

  // Generate 12 weeks of data (84 days)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 83)

  // Adjust to start from Sunday
  const dayOfWeek = startDate.getDay()
  startDate.setDate(startDate.getDate() - dayOfWeek)

  let currentMonth = -1
  for (let week = 0; week < 12; week++) {
    const weekData: DayData[] = []

    for (let day = 0; day < 7; day++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + week * 7 + day)

      const dateKey = date.toISOString().split('T')[0]
      const data = activityMap.get(dateKey) || { distance: 0, count: 0, activities: [] }

      weekData.push({
        date,
        distance: data.distance,
        count: data.count,
        activities: data.activities,
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

/**
 * Format duration in seconds to readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分`
  }
  return `${minutes}分钟`
}

/**
 * Day cell component with Popover
 */
function DayCell({
  day,
  isToday,
  isFuture,
}: {
  day: DayData
  isToday: boolean
  isFuture: boolean
}) {
  const [open, setOpen] = useState(false)
  const hasActivities = day.count > 0

  if (isFuture) {
    return <div className="h-3 w-3 rounded-sm bg-transparent" />
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'h-3 w-3 rounded-sm transition-all duration-150',
            getIntensityColor(day.distance),
            isToday && 'ring-blue ring-1 ring-offset-1',
            hasActivities && 'hover:ring-blue/50 cursor-pointer hover:scale-125 hover:ring-2',
            !hasActivities && 'cursor-default',
          )}
          disabled={!hasActivities}
          aria-label={`${day.date.toLocaleDateString('zh-CN')}: ${hasActivities ? `${day.count}次活动` : '无活动'}`}
        />
      </Popover.Trigger>

      <AnimatePresence>
        {open && hasActivities && (
          <Popover.Portal forceMount>
            <Popover.Content sideOffset={8} align="center" className="z-50" asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-64 rounded-xl border border-white/20 bg-white/90 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-black/90"
              >
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-label text-sm font-medium">
                    {day.date.toLocaleDateString('zh-CN', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </span>
                  <Popover.Close asChild>
                    <button
                      type="button"
                      className="text-label/40 hover:text-label rounded-full p-1 transition-colors"
                      aria-label="关闭"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Popover.Close>
                </div>

                {/* Stats */}
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-black/5 p-2 dark:bg-white/5">
                    <div className="text-label/50 text-xs">活动次数</div>
                    <div className="text-label text-lg font-semibold">{day.count}</div>
                  </div>
                  <div className="rounded-lg bg-black/5 p-2 dark:bg-white/5">
                    <div className="text-label/50 text-xs">总距离</div>
                    <div className="text-label text-lg font-semibold">
                      {(day.distance / 1000).toFixed(1)}
                      <span className="text-label/50 ml-0.5 text-xs">km</span>
                    </div>
                  </div>
                </div>

                {/* Activity list */}
                <div className="space-y-2">
                  <div className="text-label/50 text-xs">活动列表</div>
                  <div className="max-h-32 space-y-1.5 overflow-y-auto">
                    {day.activities.map((activity) => (
                      <Link
                        key={activity.id}
                        href={`/activity/${activity.id}`}
                        className="flex items-center justify-between rounded-lg bg-black/5 p-2 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                        onClick={() => setOpen(false)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-label truncate text-sm font-medium">
                            {activity.title || '跑步'}
                          </div>
                          <div className="text-label/50 text-xs">
                            {formatDuration(activity.duration)}
                          </div>
                        </div>
                        <div className="text-label ml-2 text-sm font-medium">
                          {(activity.distance / 1000).toFixed(1)} km
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <Popover.Arrow className="fill-white/90 dark:fill-black/90" />
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        )}
      </AnimatePresence>
    </Popover.Root>
  )
}

export function ActivityHeatmap({ activities, className }: ActivityHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => generateCalendarData(activities), [activities])
  const streaks = useMemo(() => calculateStreaks(activities), [activities])

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
      {/* Header with streak badges */}
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-label text-sm font-medium">跑步热力图</h3>

          {/* Streak badges */}
          <div className="flex items-center gap-2">
            {streaks.current > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-orange/10 flex items-center gap-1 rounded-full px-2 py-0.5"
              >
                <Flame className="text-orange h-3 w-3" />
                <span className="text-orange text-xs font-medium">{streaks.current}天连续</span>
              </motion.div>
            )}
            {streaks.longest > 0 && streaks.longest > streaks.current && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-yellow/10 flex items-center gap-1 rounded-full px-2 py-0.5"
              >
                <Trophy className="text-yellow h-3 w-3" />
                <span className="text-yellow text-xs font-medium">最长{streaks.longest}天</span>
              </motion.div>
            )}
          </div>
        </div>

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

                    return <DayCell key={dateKey} day={day} isToday={isToday} isFuture={isFuture} />
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
