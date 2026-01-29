/**
 * Activity Table Component
 *
 * Glassmorphic card design with spring-based interactions, achievement badges, and animations
 */

'use client'

import { motion } from 'framer-motion'
import {
  Calendar,
  ChevronRight,
  Clock,
  Flame,
  Gauge,
  Mountain,
  Trophy,
  TrendingUp,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

import { RippleContainer } from '@/components/ui/ripple'
import { layoutTransition, springs } from '@/lib/animation'
import { calculatePace, formatDuration, formatPace } from '@/lib/pace/calculator'
import type { Activity } from '@/types/activity'

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
function calculateAchievements(activities: Activity[]): Map<string, Achievement[]> {
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
  activities: Activity[]
  className?: string
}

export function ActivityTable({ activities, className = '' }: ActivityTableProps) {
  // Calculate achievements for all activities
  const achievements = calculateAchievements(activities)

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

  return (
    <motion.div
      className={`space-y-2 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {activities.map((activity) => (
        <motion.div
          key={activity.id}
          layoutId={`activity-card-${activity.id}`}
          layout="position"
          transition={layoutTransition}
          variants={itemVariants}
          className="group"
        >
          <Link href={`/activity/${activity.id}`}>
            <RippleContainer className="rounded-xl" color="rgba(0, 0, 0, 0.08)">
              <motion.div
                className="rounded-xl border border-white/20 bg-white/50 px-5 py-4 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-150 hover:bg-white/70 dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/30"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={springs.snappy}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Title with achievement badges */}
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-label truncate font-medium">
                        {activity.title || '跑步活动'}
                      </h3>
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

                      {/* Pace - Always show, calculate if not available */}
                      <div className="flex items-center gap-1.5">
                        <Gauge className="text-blue/60 h-3.5 w-3.5" />
                        <span className="text-blue font-medium tabular-nums">
                          {activity.averagePace
                            ? formatPace(activity.averagePace)
                            : formatPace(calculatePace(activity.distance, activity.duration))}
                        </span>
                        <span className="text-blue/60">/km</span>
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
      ))}
    </motion.div>
  )
}
