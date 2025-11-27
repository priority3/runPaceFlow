/**
 * Activity Table Component
 *
 * Glassmorphic card design with smooth depth transitions
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Mountain, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { formatDuration } from '@/lib/pace/calculator'
import type { Activity } from '@/types/activity'

export interface ActivityTableProps {
  activities: Activity[]
  className?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
}

export function ActivityTable({ activities, className = '' }: ActivityTableProps) {
  if (activities.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/50 py-16 backdrop-blur-xl dark:border-white/10 dark:bg-black/20"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
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
      <AnimatePresence mode="popLayout">
        {activities.map((activity) => (
          <motion.div key={activity.id} variants={itemVariants} layout className="group">
            <Link href={`/activity/${activity.id}`}>
              <div className="rounded-xl border border-white/20 bg-white/50 px-5 py-4 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:bg-white/70 hover:shadow-md hover:shadow-black/5 dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/30">
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
                  <ChevronRight className="text-label/30 group-hover:text-label/50 h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
