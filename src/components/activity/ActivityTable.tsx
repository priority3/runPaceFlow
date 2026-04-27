/**
 * Activity Table Component
 *
 * Glassmorphic card design with spring-based interactions, achievement badges, and animations
 */

'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'framer-motion'
import {
  Bike,
  Calendar,
  ChevronRight,
  Clock,
  Flame,
  Footprints,
  Gauge,
  Home,
  Mountain,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import type { RefObject } from 'react'
import { useCallback } from 'react'

import { RippleContainer } from '@/components/ui/ripple'
import { layoutTransition, springs } from '@/lib/animation'
import { calculatePace, calculateSpeed, formatDuration, formatPace } from '@/lib/pace/calculator'
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
 * Stagger animation variants for list items
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 25,
    },
  },
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
  if (activity.type === 'cycling') {
    return activity.title || '骑行活动'
  }

  if (activity.type !== 'running') {
    return activity.title || '运动活动'
  }

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

function getActivityTypeMeta(type: string) {
  if (type === 'cycling') {
    return {
      label: '骑行',
      icon: Bike,
      className: 'bg-green/10 text-green',
      metricClassName: 'text-green',
    }
  }

  if (type === 'running') {
    return {
      label: '跑步',
      icon: Footprints,
      className: 'bg-blue/10 text-blue',
      metricClassName: 'text-blue',
    }
  }

  return {
    label: '运动',
    icon: TrendingUp,
    className: 'bg-gray/10 text-label/60',
    metricClassName: 'text-blue',
  }
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
  const activitiesWithPace = activities.filter(
    (a) => a.type === 'running' && a.averagePace && a.averagePace > 0,
  )
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
      color: 'bg-yellow/20 text-yellow',
    })
    achievements.set(longestActivity.id, existing)
  }

  if (fastestActivity && fastestActivity.averagePace && fastestActivity.averagePace < 360) {
    const existing = achievements.get(fastestActivity.id) || []
    existing.push({
      type: 'fastest',
      label: '最快',
      icon: <Zap className="h-3 w-3" />,
      color: 'bg-green/20 text-green',
    })
    achievements.set(fastestActivity.id, existing)
  }

  if (mostElevationActivity && (mostElevationActivity.elevationGain || 0) >= 100) {
    const existing = achievements.get(mostElevationActivity.id) || []
    existing.push({
      type: 'mostElevation',
      label: '爬坡王',
      icon: <Flame className="h-3 w-3" />,
      color: 'bg-orange/20 text-orange',
    })
    achievements.set(mostElevationActivity.id, existing)
  }

  return achievements
}

export interface ActivityTableProps {
  activities: ActivityListItem[]
  className?: string
  virtualized?: boolean
  scrollRef?: RefObject<HTMLElement | null>
}

export function ActivityTable({
  activities,
  className = '',
  virtualized = false,
  scrollRef,
}: ActivityTableProps) {
  // Calculate achievements for all activities
  const achievements = calculateAchievements(activities)

  // Get trpc utils for prefetching
  const trpcUtils = trpc.useUtils()

  // Prefetch activity data on hover for faster navigation
  const handleMouseEnter = useCallback(
    (activityId: string) => {
      // Prefetch activity with splits data
      trpcUtils.activities.getWithSplits.prefetch({ id: activityId })
    },
    [trpcUtils],
  )

  const rowVirtualizer = useVirtualizer({
    count: activities.length,
    getScrollElement: () => scrollRef?.current ?? null,
    estimateSize: () => 128,
    overscan: 6,
  })

  if (activities.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/50 py-16 backdrop-blur-xl dark:border-white/10 dark:bg-black/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="mb-4 rounded-full bg-white/60 p-4 dark:bg-white/10">
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

  const renderRow = (activity: ActivityListItem) => {
    const typeMeta = getActivityTypeMeta(activity.type)
    const TypeIcon = typeMeta.icon
    const isCycling = activity.type === 'cycling'
    const metricValue = isCycling
      ? calculateSpeed(activity.distance, activity.duration).toFixed(1)
      : activity.averagePace
        ? formatPace(activity.averagePace)
        : formatPace(calculatePace(activity.distance, activity.duration))
    const metricUnit = isCycling ? 'km/h' : '/km'

    return (
      <motion.div
        key={activity.id}
        layoutId={`activity-card-${activity.id}`}
        layout="position"
        transition={layoutTransition}
        variants={itemVariants}
        className="group"
      >
        <Link href={`/activity/${activity.id}`} onMouseEnter={() => handleMouseEnter(activity.id)}>
          <RippleContainer className="rounded-xl" color="rgba(0, 0, 0, 0.08)">
            <motion.div
              className="rounded-xl border-0 bg-transparent px-5 py-4 transition-colors duration-150 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={springs.snappy}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Title with achievement badges */}
                  <div className="mb-2 flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-label truncate font-medium">
                        {getSmartActivityTitle(activity)}
                      </h3>
                      {/* Show original title as subtitle if using smart title or race name */}
                      {activity.raceName &&
                        activity.title &&
                        activity.raceName !== activity.title && (
                          <p className="text-label/50 mt-0.5 truncate text-xs">{activity.title}</p>
                        )}
                    </div>
                    <span
                      className={cn(
                        'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        typeMeta.className,
                      )}
                    >
                      <TypeIcon className="h-3 w-3" />
                      {typeMeta.label}
                    </span>
                    {/* Indoor badge */}
                    {activity.isIndoor && (
                      <span className="bg-gray/20 text-gray flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                        <Home className="h-3 w-3" />
                        室内
                      </span>
                    )}
                    {/* Achievement badges */}
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

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
                    {/* Distance */}
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="text-label/30 h-3.5 w-3.5" />
                      <span className="text-label/80 tabular-nums">
                        {(activity.distance / 1000).toFixed(2)}
                      </span>
                      <span className="text-label/50">km</span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="text-label/30 h-3.5 w-3.5" />
                      <span className="text-label/80 tabular-nums">
                        {formatDuration(activity.duration)}
                      </span>
                    </div>

                    {/* Pace or speed */}
                    <div className="flex items-center gap-1.5">
                      <Gauge
                        className={cn('h-3.5 w-3.5', typeMeta.metricClassName, 'opacity-60')}
                      />
                      <span className={cn('font-medium tabular-nums', typeMeta.metricClassName)}>
                        {metricValue}
                      </span>
                      <span className={cn(typeMeta.metricClassName, 'opacity-60')}>
                        {metricUnit}
                      </span>
                    </div>

                    {/* Elevation */}
                    {activity.elevationGain && activity.elevationGain > 0 && (
                      <div className="hidden items-center gap-1.5 sm:flex">
                        <Mountain className="text-label/30 h-3.5 w-3.5" />
                        <span className="text-label/80 tabular-nums">
                          {Math.round(activity.elevationGain)}
                        </span>
                        <span className="text-label/50">m</span>
                      </div>
                    )}

                    {/* Weather */}
                    {activity.weatherData && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-label/80 tabular-nums">
                          {getWeatherLabel(activity.weatherData)}
                        </span>
                      </div>
                    )}

                    {/* Date with weekday */}
                    <div className="ml-auto flex items-center gap-1.5">
                      <Calendar className="text-label/30 h-3.5 w-3.5" />
                      <span className="text-label/50">
                        {formatDateWithWeekday(new Date(activity.startTime))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow with hover animation */}
                <motion.div initial={false} whileHover={{ x: 4 }} transition={springs.snappy}>
                  <ChevronRight className="text-label/30 group-hover:text-label/50 h-5 w-5 flex-shrink-0 transition-colors duration-150" />
                </motion.div>
              </div>
            </motion.div>
          </RippleContainer>
        </Link>
      </motion.div>
    )
  }

  if (!virtualized || !scrollRef) {
    return (
      <motion.div
        className={`space-y-2 ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {activities.map((activity) => renderRow(activity))}
      </motion.div>
    )
  }

  return (
    <div className={cn('relative', className)} style={{ height: rowVirtualizer.getTotalSize() }}>
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const activity = activities[virtualRow.index]
        if (!activity) return null
        const isLast = virtualRow.index === activities.length - 1
        return (
          <div
            key={activity.id}
            ref={rowVirtualizer.measureElement}
            data-index={virtualRow.index}
            className={cn('absolute top-0 left-0 w-full', !isLast && 'pb-2')}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            {renderRow(activity)}
          </div>
        )
      })}
    </div>
  )
}
