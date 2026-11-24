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
 * Parse weather JSON and return compact display string.
 * pr-ui：不用 emoji 装饰，温度本身就是内容。
 */
function getWeatherLabel(weatherData: string | null): string | null {
  if (!weatherData) return null
  try {
    const w = JSON.parse(weatherData) as { temperature: number; weatherCode: number }
    if (w.temperature == null) return null
    return `${w.temperature}°`
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
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
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

  // 距离本身就是标签，不再加 emoji 徽章
  if (Math.abs(distanceKm - 5) <= 0.5) return '5K'
  if (Math.abs(distanceKm - 10) <= 0.5) return '10K'
  if (Math.abs(distanceKm - 21.0975) <= 0.5) return '半程马拉松'
  if (Math.abs(distanceKm - 42.195) <= 0.5) return '全程马拉松'

  return activity.title || '跑步活动'
}

function getActivityTypeMeta(type: string) {
  // 类型标签是元信息，不是彩色装饰；主数据一律用墨色
  if (type === 'cycling') {
    return {
      label: '骑行',
      icon: Bike,
      className: 'pr-tag',
      metricClassName: 'text-label',
    }
  }

  if (type === 'running') {
    return {
      label: '跑步',
      icon: Footprints,
      className: 'pr-tag',
      metricClassName: 'text-label',
    }
  }

  return {
    label: '运动',
    icon: TrendingUp,
    className: 'pr-tag',
    metricClassName: 'text-label',
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
      color: '',
    })
    achievements.set(longestActivity.id, existing)
  }

  if (fastestActivity && fastestActivity.averagePace && fastestActivity.averagePace < 360) {
    const existing = achievements.get(fastestActivity.id) || []
    existing.push({
      type: 'fastest',
      label: '最快',
      icon: <Zap className="h-3 w-3" />,
      color: '',
    })
    achievements.set(fastestActivity.id, existing)
  }

  if (mostElevationActivity && (mostElevationActivity.elevationGain || 0) >= 100) {
    const existing = achievements.get(mostElevationActivity.id) || []
    existing.push({
      type: 'mostElevation',
      label: '爬坡王',
      icon: <Flame className="h-3 w-3" />,
      color: '',
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
        className={cn(
          'border-separator/60 flex min-h-40 items-center border-y py-9 sm:min-h-44 sm:py-10',
          className,
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* 空态：一句话 + 下一步，不给插画 */}
        <div className="pr-empty">
          <p className="pr-empty-line">还没有可复盘的活动</p>
          <p>接入数据后，这里会按时间列出每一次训练。</p>
        </div>
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
          <RippleContainer>
            {/* 列表用线分隔，hover 底色铺满整行，不做卡片与位移 */}
            <motion.div className="group px-1 py-4 transition-colors duration-200 hover:bg-[var(--pr-sel)]">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Title with achievement badges */}
                  <div className="mb-2 flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-label truncate text-[14px] leading-snug">
                        {getSmartActivityTitle(activity)}
                      </h3>
                      <p className="pr-meta mt-1">
                        {formatDateWithWeekday(new Date(activity.startTime))}
                      </p>
                      {/* Show original title as subtitle if using smart title or race name */}
                      {activity.raceName &&
                        activity.title &&
                        activity.raceName !== activity.title && (
                          <p className="pr-meta mt-0.5 truncate">{activity.title}</p>
                        )}
                    </div>
                    <span className={cn('pr-tag', typeMeta.className)}>
                      <TypeIcon className="h-3 w-3" />
                      {typeMeta.label}
                    </span>
                    {/* 室内 / 成就：同一枚中性标签，不靠颜色区分 */}
                    {activity.isIndoor && (
                      <span className="pr-tag">
                        <Home className="h-3 w-3" />
                        室内
                      </span>
                    )}
                    {achievements.get(activity.id)?.map((achievement) => (
                      <span key={achievement.type} className={cn('pr-tag', achievement.color)}>
                        {achievement.icon}
                        {achievement.label}
                      </span>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-3 text-[13px] sm:gap-4">
                    {/* Distance */}
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="text-tertiary-label h-3.5 w-3.5" />
                      <span className="text-label tabular-nums">
                        {(activity.distance / 1000).toFixed(2)}
                      </span>
                      <span className="text-tertiary-label">km</span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="text-tertiary-label h-3.5 w-3.5" />
                      <span className="text-label tabular-nums">
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
                        <Mountain className="text-tertiary-label h-3.5 w-3.5" />
                        <span className="text-label tabular-nums">
                          {Math.round(activity.elevationGain)}
                        </span>
                        <span className="text-tertiary-label">m</span>
                      </div>
                    )}

                    {/* Weather */}
                    {activity.weatherData && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-label tabular-nums">
                          {getWeatherLabel(activity.weatherData)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow with hover animation */}
                <ChevronRight className="text-tertiary-label group-hover:text-label h-5 w-5 flex-shrink-0 transition-colors duration-150" />
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
        className={`divide-separator divide-y ${className}`}
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
