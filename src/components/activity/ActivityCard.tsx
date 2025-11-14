/**
 * ActivityCard Component
 *
 * Display activity information with play button for route animation
 * Enhanced with Framer Motion for smooth interactions
 */

'use client'

import { motion } from 'framer-motion'
import { useSetAtom } from 'jotai'
import { Play } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cardVariants, springs } from '@/lib/animation/variants'
import { formatDuration, formatPace } from '@/lib/pace/calculator'
import { formatDate, formatTime } from '@/lib/utils'
import { playingActivityIdAtom } from '@/stores/map'

export interface ActivityCardProps {
  id: string
  title: string
  type: string
  startTime: Date | number
  duration: number // seconds
  distance: number // meters
  averagePace?: number // seconds/km
  elevationGain?: number // meters
  onClick?: () => void
  /**
   * Animation delay for staggered list animations
   * @default 0
   */
  delay?: number
}

export function ActivityCard({
  id,
  title,
  type,
  startTime,
  duration,
  distance,
  averagePace,
  elevationGain,
  onClick,
  delay = 0,
}: ActivityCardProps) {
  const setPlayingActivityId = useSetAtom(playingActivityIdAtom)
  const router = useRouter()

  const handleCardClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Navigate to activity detail page
      router.push(`/activity/${id}`)
    }
  }

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPlayingActivityId(id)
  }

  const distanceKm = (distance / 1000).toFixed(2)
  const typeEmoji = type === 'running' ? '🏃' : type === 'cycling' ? '🚴' : '🚶'

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      transition={{
        ...springs.smooth,
        delay,
      }}
      onClick={handleCardClick}
      className="cursor-pointer"
    >
      <Card animated fadeIn>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1, ...springs.smooth }}
            >
              <CardTitle className="text-lg">
                {typeEmoji} {title}
              </CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.2, ...springs.bouncy }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlay}
                className="text-blue hover:bg-blue/10 h-8 w-8"
              >
                <Play className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
          <motion.p
            className="text-secondary-label text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.15 }}
          >
            {formatDate(startTime)} {formatTime(startTime)}
          </motion.p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.25, ...springs.smooth }}
            >
              <span className="text-tertiary-label text-xs">距离</span>
              <span className="text-label text-lg font-semibold">{distanceKm} km</span>
            </motion.div>
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.3, ...springs.smooth }}
            >
              <span className="text-tertiary-label text-xs">时长</span>
              <span className="text-label text-lg font-semibold">{formatDuration(duration)}</span>
            </motion.div>
            {averagePace && (
              <motion.div
                className="flex flex-col"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.35, ...springs.smooth }}
              >
                <span className="text-tertiary-label text-xs">配速</span>
                <span className="text-label text-lg font-semibold">{formatPace(averagePace)}</span>
              </motion.div>
            )}
            {elevationGain !== undefined && elevationGain > 0 && (
              <motion.div
                className="flex flex-col"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.4, ...springs.smooth }}
              >
                <span className="text-tertiary-label text-xs">爬升</span>
                <span className="text-label text-lg font-semibold">
                  {elevationGain.toFixed(0)} m
                </span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
