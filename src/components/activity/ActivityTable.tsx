/**
 * Activity Table Component
 *
 * Glassmorphic card design with spring-based interactions
 */

'use client'

import { motion } from 'framer-motion'
import { Calendar, ChevronRight, Clock, Mountain, TrendingUp } from 'lucide-react'
import Link from 'next/link'

import { layoutTransition, springs } from '@/lib/animation'
import { formatDuration } from '@/lib/pace/calculator'
import type { Activity } from '@/types/activity'

export interface ActivityTableProps {
  activities: Activity[]
  className?: string
}

export function ActivityTable({ activities, className = '' }: ActivityTableProps) {
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
    <div className={`space-y-2 ${className}`}>
      {activities.map((activity) => (
        <motion.div
          key={activity.id}
          layoutId={`activity-card-${activity.id}`}
          layout="position"
          transition={layoutTransition}
          className="group"
        >
          <Link href={`/activity/${activity.id}`}>
            <motion.div
              className="rounded-xl border border-white/20 bg-white/50 px-5 py-4 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-150 hover:bg-white/70 dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/30"
              whileTap={{ scale: 0.98 }}
              transition={springs.snappy}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Title */}
                  <h3 className="text-label mb-2 truncate font-medium">
                    {activity.title || '跑步活动'}
                  </h3>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm sm:gap-5">
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

                    {/* Elevation */}
                    {activity.elevationGain && activity.elevationGain > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Mountain className="text-label/30 h-3.5 w-3.5" />
                        <span className="text-label/80 tabular-nums">
                          {Math.round(activity.elevationGain)}
                        </span>
                        <span className="text-label/50">m</span>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="text-label/30 h-3.5 w-3.5" />
                      <span className="text-label/50">
                        {new Date(activity.startTime).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="text-label/30 group-hover:text-label/50 h-5 w-5 flex-shrink-0 transition-all duration-150 group-hover:translate-x-0.5" />
              </div>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
