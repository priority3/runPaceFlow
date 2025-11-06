/**
 * Activity Table Component
 *
 * Clean, modern table design inspired by cyc.earth with smooth animations
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
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
        className="bg-fill rounded-3xl p-16 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-placeholder-text text-lg">还没有活动记录</p>
        <p className="text-placeholder-text/70 mt-2 text-sm">同步 Nike Run Club 数据后，活动将显示在这里</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`overflow-hidden rounded-3xl border border-separator ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <table className="w-full">
        <motion.thead
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <tr className="bg-fill border-b border-separator">
            <th className="text-placeholder-text px-8 py-5 text-left text-sm font-medium">活动名称</th>
            <th className="text-placeholder-text px-8 py-5 text-right text-sm font-medium">距离</th>
            <th className="text-placeholder-text px-8 py-5 text-right text-sm font-medium">用时</th>
            <th className="text-placeholder-text px-8 py-5 text-right text-sm font-medium">爬升</th>
            <th className="text-placeholder-text px-8 py-5 text-right text-sm font-medium">日期</th>
          </tr>
        </motion.thead>
        <motion.tbody
          className="bg-background divide-y divide-separator/50"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {activities.map((activity, index) => (
              <motion.tr
                key={activity.id}
                variants={staggerItemVariants}
                layout
                custom={index}
                whileHover={{
                  backgroundColor: 'rgba(var(--fill-rgb), 0.3)',
                  transition: { duration: 0.2 },
                }}
                className="group"
              >
                <td className="px-8 py-5">
                  <Link
                    href={`/activity/${activity.id}`}
                    className="text-text group-hover:text-link font-medium transition-colors duration-200"
                  >
                    <motion.span
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      {activity.title || '跑步活动'}
                    </motion.span>
                  </Link>
                </td>
                <td className="text-text px-8 py-5 text-right font-mono text-sm">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.2 }}
                  >
                    {(activity.distance / 1000).toFixed(2)} km
                  </motion.span>
                </td>
                <td className="text-text px-8 py-5 text-right font-mono text-sm">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.25 }}
                  >
                    {formatDuration(activity.duration)}
                  </motion.span>
                </td>
                <td className="text-text px-8 py-5 text-right font-mono text-sm">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.3 }}
                  >
                    {activity.elevationGain ? `${Math.round(activity.elevationGain)} m` : '-'}
                  </motion.span>
                </td>
                <td className="text-text px-8 py-5 text-right text-sm">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.35 }}
                  >
                    {new Date(activity.startTime).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </motion.span>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </motion.tbody>
      </table>
    </motion.div>
  )
}
