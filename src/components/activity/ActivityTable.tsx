/**
 * Activity Table Component
 *
 * Modern card-based design with enhanced visual hierarchy and interactions
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Mountain, Activity as ActivityIcon } from 'lucide-react'
import Link from 'next/link'

import { formatDuration } from '@/lib/pace/calculator'
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animation/variants'
import type { Activity } from '@/types/activity'

export interface ActivityTableProps {
  activities: Activity[]
  className?: string
}

export function ActivityTable({ activities, className = '' }: ActivityTableProps) {
  if (activities.length === 0) {
    return (
      <motion.div
        className="border-separator bg-secondary-system-background rounded-2xl border p-16 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bg-system-fill mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full p-4">
          <ActivityIcon className="text-tertiary-label size-8" />
        </div>
        <p className="text-label text-lg font-medium">还没有活动记录</p>
        <p className="text-secondary-label mt-2 text-sm">
          同步 Nike Run Club 或 Strava 数据后，活动将显示在这里
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`space-y-3 sm:space-y-4 ${className}`}
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            variants={staggerItemVariants}
            layout
            custom={index}
            whileHover={{
              scale: 1.01,
              transition: { duration: 0.2 },
            }}
            className="group"
          >
            <Link href={`/activity/${activity.id}`}>
              <div className="border-separator bg-secondary-system-background rounded-2xl border p-4 transition-all duration-200 hover:shadow-md sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left Section - Title and Metadata */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-label group-hover:text-link mb-3 truncate text-lg font-semibold transition-colors sm:text-xl">
                      {activity.title || '跑步活动'}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                      {/* Distance */}
                      <div className="flex items-center gap-2">
                        <div className="bg-blue/10 rounded-lg p-2">
                          <ActivityIcon className="text-blue size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-tertiary-label text-xs">距离</p>
                          <p className="text-label truncate text-sm font-semibold tabular-nums sm:text-base">
                            {(activity.distance / 1000).toFixed(2)} km
                          </p>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-2">
                        <div className="bg-purple/10 rounded-lg p-2">
                          <Clock className="text-purple size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-tertiary-label text-xs">用时</p>
                          <p className="text-label truncate text-sm font-semibold tabular-nums sm:text-base">
                            {formatDuration(activity.duration)}
                          </p>
                        </div>
                      </div>

                      {/* Elevation */}
                      <div className="flex items-center gap-2">
                        <div className="bg-orange/10 rounded-lg p-2">
                          <Mountain className="text-orange size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-tertiary-label text-xs">爬升</p>
                          <p className="text-label truncate text-sm font-semibold tabular-nums sm:text-base">
                            {activity.elevationGain
                              ? `${Math.round(activity.elevationGain)} m`
                              : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <div className="bg-green/10 rounded-lg p-2">
                          <Calendar className="text-green size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-tertiary-label text-xs">日期</p>
                          <p className="text-label truncate text-sm font-semibold sm:text-base">
                            {new Date(activity.startTime).toLocaleDateString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Arrow Indicator */}
                  <div className="hidden items-center sm:flex">
                    <motion.div
                      className="bg-system-fill group-hover:bg-link/10 rounded-full p-2 transition-colors"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <svg
                        className="text-tertiary-label group-hover:text-link size-5 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
