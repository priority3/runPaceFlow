/**
 * Activity Table Component
 *
 * Glassmorphic card design with spring-based interactions, achievement badges, and animations
 */

'use client'

import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'framer-motion'
import {
  Calendar,
  ChevronRight,
  Clock,
  Flame,
  Gauge,
  Home,
  Mountain,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { RippleContainer } from '@/components/ui/ripple'
import { springs } from '@/lib/animation'
import { calculatePace, formatDuration, formatPace } from '@/lib/pace/calculator'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import type { ActivityListItem } from '@/types/activity'

/**
 * WMO weather code → emoji (compact version for list view)
 */
function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 57) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 67) return '🧊'
  if (code <= 77) return '🌨️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '🌡️'
}

/**
 * Parse weather JSON and return compact display string
 */
function getWeatherLabel(weatherData: string | null): string | null {
  if (!weatherData) return null
  try {
    const w = JSON.parse(weatherData) as { temperature: number; weatherCode: number }
    if (w.temperature == null) return null
    return `${getWeatherEmoji(w.weatherCode)} ${w.temperature}°`
  } catch {
    return null
  }
}

/**
 * Format date with weekday in Chinese
 */
function formatDateWithWeekday(date: Date): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  const monthDay = date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
  return `${monthDay} ${weekday}`
}

/**
 * Generate activity title with emoji badges for 5K/10K
 */
function getSmartActivityTitle(activity: ActivityListItem): string {
  // If has race name, use it
  if (activity.raceName) {
    return activity.raceName
  }

  const distanceKm = activity.distance / 1000

  // Add emoji badge for common race distances (with ±0.5km tolerance)
  if (Math.abs(distanceKm - 5) <= 0.5) {
    return '🎯 5K'
  }
  if (Math.abs(distanceKm - 10) <= 0.5) {
    return '🔥 10K'
  }
  if (Math.abs(distanceKm - 21.0975) <= 0.5) {
    return '🏅 半马'
  }
  if (Math.abs(distanceKm - 42.195) <= 0.5) {
    return '🏆 全马'
  }

  return activity.title || '跑步活动'
}

/**
 * Achievement badge types
 */
type AchievementType = 'longest' | 'fastest' | 'mostElevation' | 'streak'

interface Achievement {
  type: AchievementType
  label: string
  icon: React.ReactNode
  color: string
}

/**
 * Calculate achievements for activities
 */
function calculateAchievements(activities: ActivityListItem[]): Map<string, Achievement[]> {
  const achievements = new Map<string, Achievement[]>()

  if (activities.length === 0) return achievements

  // Find longest distance
  const longestActivity = activities.reduce((max, a) => (a.distance > max.distance ? a : max))

  // Find fastest pace (lowest pace value = fastest)
  const activitiesWithPace = activities.filter((a) => a.averagePace && a.averagePace > 0)
  const fastestActivity =
    activitiesWithPace.length > 0
      ? activitiesWithPace.reduce((min, a) =>
          (a.averagePace || Infinity) < (min.averagePace || Infinity) ? a : min,
        )
      : null

  // Find most elevation gain
  const activitiesWithElevation = activities.filter((a) => a.elevationGain && a.elevationGain > 0)
  const mostElevationActivity =
    activitiesWithElevation.length > 0
      ? activitiesWithElevation.reduce((max, a) =>
          (a.elevationGain || 0) > (max.elevationGain || 0) ? a : max,
        )
      : null

  // Add achievements
  if (longestActivity.distance >= 5000) {
    const existing = achievements.get(longestActivity.id) || []
    existing.push({
      type: 'longest',
      label: '最长',
      icon: <Trophy className="h-3 w-3" />,
      color: 'bg-mint/12 text-mint',
    })
    achievements.set(longestActivity.id, existing)
  }

  if (fastestActivity && fastestActivity.averagePace && fastestActivity.averagePace < 360) {
    const existing = achievements.get(fastestActivity.id) || []
    existing.push({
      type: 'fastest',
      label: '最快',
      icon: <Zap className="h-3 w-3" />,
      color: 'bg-mint/16 text-mint',
    })
    achievements.set(fastestActivity.id, existing)
  }

  if (mostElevationActivity && (mostElevationActivity.elevationGain || 0) >= 100) {
    const existing = achievements.get(mostElevationActivity.id) || []
    existing.push({
      type: 'mostElevation',
      label: '爬坡王',
      icon: <Flame className="h-3 w-3" />,
      color: 'bg-mint/10 text-mint',
    })
    achievements.set(mostElevationActivity.id, existing)
  }

  return achievements
}

export interface ActivityTableProps {
  activities: ActivityListItem[]
  className?: string
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  /** Hovered activity id for map/list linking */
  hoveredActivityId?: string | null
  /** Callback when hovered activity changes */
  onHoverActivity?: (activityId: string | null) => void
}

export function ActivityTable({
  activities,
  className = '',
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  hoveredActivityId,
  onHoverActivity,
}: ActivityTableProps) {
  const achievements = useMemo(() => calculateAchievements(activities), [activities])

  // Get trpc utils for prefetching
  const trpcUtils = trpc.useUtils()

  // Prefetch activity data on hover for faster navigation
  const handleRowMouseEnter = useCallback(
    (activityId: string) => {
      // Prefetch activity with splits data
      trpcUtils.activities.getWithSplits.prefetch({ id: activityId })
    },
    [trpcUtils],
  )

  if (activities.length === 0) {
    return (
      <motion.div
        className="border-separator bg-secondary-system-background/60 flex flex-col items-center justify-center rounded-2xl border py-16 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-secondary-system-fill/60 mb-4 rounded-full p-4">
          <TrendingUp className="text-label/40 h-8 w-8" />
        </div>
        <p className="text-label text-lg font-medium">还没有活动记录</p>
        <p className="text-label/50 mt-2 text-center text-sm">
          同步你的运动数据后
          <br />
          活动将显示在这里
        </p>
      </motion.div>
    )
  }

  const parentRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  const itemCount = hasMore ? activities.length + 1 : activities.length

  useEffect(() => {
    if (typeof window === 'undefined') return
    const element = parentRef.current
    if (!element) return

    const update = () => {
      const rect = element.getBoundingClientRect()
      setScrollMargin(rect.top + window.scrollY)
    }

    update()

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(document.body)
    window.addEventListener('resize', update)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const rowVirtualizer = useWindowVirtualizer({
    count: itemCount,
    estimateSize: () => 104,
    overscan: 10,
    scrollMargin,
    getItemKey: (index) => activities[index]?.id ?? '__loader__',
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  useEffect(() => {
    if (!hasMore || !onLoadMore || isLoadingMore) return
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return

    const loadMoreThreshold = 5
    if (lastItem.index >= Math.max(activities.length - 1 - loadMoreThreshold, 0)) {
      onLoadMore()
    }
  }, [activities.length, hasMore, isLoadingMore, onLoadMore, virtualItems])

  return (
    <div ref={parentRef} className={className}>
      <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {virtualItems.map((virtualRow) => {
          const isLoaderRow = virtualRow.index >= activities.length
          const activity = activities[virtualRow.index]
          const isHovered = !!activity && hoveredActivityId === activity.id

          return (
            <div
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              className="absolute top-0 left-0 w-full pb-2"
              style={{
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
              }}
            >
              {isLoaderRow || !activity ? (
                hasMore ? (
                  <div className="bg-secondary-system-background/50 h-24 animate-pulse rounded-2xl" />
                ) : null
              ) : (
                <div className="group">
                  <Link
                    href={`/activity/${activity.id}`}
                    onMouseEnter={() => {
                      handleRowMouseEnter(activity.id)
                      onHoverActivity?.(activity.id)
                    }}
                    onMouseLeave={() => onHoverActivity?.(null)}
                  >
                    <RippleContainer className="rounded-2xl" color="rgba(0, 0, 0, 0.08)">
                      <motion.div
                        className={cn(
                          'border-separator bg-secondary-system-background/60 hover:bg-secondary-system-background/70 rounded-2xl border px-5 py-4 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-200',
                          isHovered && 'border-mint/30 ring-mint/25 ring-1 ring-inset',
                        )}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={springs.snappy}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-label truncate font-medium">
                                  {getSmartActivityTitle(activity)}
                                </h3>
                                {activity.raceName &&
                                  activity.title &&
                                  activity.raceName !== activity.title && (
                                    <p className="text-label/50 mt-0.5 truncate text-xs">
                                      {activity.title}
                                    </p>
                                  )}
                              </div>
                              {activity.isIndoor && (
                                <span className="bg-secondary-system-fill/60 text-secondary-label flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                                  <Home className="h-3 w-3" />
                                  室内
                                </span>
                              )}
                              {achievements.get(activity.id)?.map((achievement) => (
                                <span
                                  key={achievement.type}
                                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${achievement.color}`}
                                >
                                  {achievement.icon}
                                  {achievement.label}
                                </span>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className="text-label/30 h-3.5 w-3.5" />
                                <span className="text-label/80 tabular-nums">
                                  {(activity.distance / 1000).toFixed(2)}
                                </span>
                                <span className="text-label/50">km</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Clock className="text-label/30 h-3.5 w-3.5" />
                                <span className="text-label/80 tabular-nums">
                                  {formatDuration(activity.duration)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Gauge
                                  className={cn(
                                    'h-3.5 w-3.5',
                                    isHovered ? 'text-mint/70' : 'text-label/30',
                                  )}
                                />
                                <span
                                  className={cn(
                                    'font-medium tabular-nums',
                                    isHovered ? 'text-mint' : 'text-label/80',
                                  )}
                                >
                                  {activity.averagePace
                                    ? formatPace(activity.averagePace)
                                    : formatPace(
                                        calculatePace(activity.distance, activity.duration),
                                      )}
                                </span>
                                <span className="text-tertiary-label">/km</span>
                              </div>

                              {activity.elevationGain && activity.elevationGain > 0 && (
                                <div className="hidden items-center gap-1.5 sm:flex">
                                  <Mountain className="text-label/30 h-3.5 w-3.5" />
                                  <span className="text-label/80 tabular-nums">
                                    {Math.round(activity.elevationGain)}
                                  </span>
                                  <span className="text-label/50">m</span>
                                </div>
                              )}

                              {activity.weatherData && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-label/80 tabular-nums">
                                    {getWeatherLabel(activity.weatherData)}
                                  </span>
                                </div>
                              )}

                              <div className="ml-auto flex items-center gap-1.5">
                                <Calendar className="text-label/30 h-3.5 w-3.5" />
                                <span className="text-label/50">
                                  {formatDateWithWeekday(new Date(activity.startTime))}
                                </span>
                              </div>
                            </div>
                          </div>

                          <motion.div
                            initial={false}
                            whileHover={{ x: 4 }}
                            transition={springs.snappy}
                          >
                            <ChevronRight className="text-label/30 group-hover:text-label/50 h-5 w-5 flex-shrink-0 transition-colors duration-150" />
                          </motion.div>
                        </div>
                      </motion.div>
                    </RippleContainer>
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
