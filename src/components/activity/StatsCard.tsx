/**
 * StatsCard Component
 *
 * Display running statistics in a card format with animated number counter
 */

'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface StatsCardProps {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  className?: string
  /**
   * Enable number count animation
   * @default true
   */
  animateNumber?: boolean
  /**
   * Animation delay in seconds
   * @default 0
   */
  delay?: number
}

export function StatsCard({
  title,
  value,
  unit,
  subtitle,
  className,
  animateNumber = true,
  delay = 0,
}: StatsCardProps) {
  const [hasAnimated, setHasAnimated] = useState(false)
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) => Math.round(latest))

  // Parse numeric value for animation
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value))
  const isNumeric = !isNaN(numericValue)

  useEffect(() => {
    if (isNumeric && animateNumber && !hasAnimated) {
      const controls = animate(motionValue, numericValue, {
        duration: 1.5,
        delay,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo
      })

      setHasAnimated(true)
      return controls.stop
    }
    return undefined
  }, [numericValue, motionValue, animateNumber, delay, hasAnimated, isNumeric])

  return (
    <Card className={cn('', className)} fadeIn animated>
      <CardContent className="p-6">
        <motion.div
          className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: delay + 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <p className="text-placeholder-text text-sm font-medium">{title}</p>
          <div className="flex items-baseline gap-1">
            {isNumeric && animateNumber ? (
              <motion.span className="text-text text-3xl font-bold tabular-nums">
                <motion.span>{rounded}</motion.span>
              </motion.span>
            ) : (
              <span className="text-text text-3xl font-bold">{value}</span>
            )}
            {unit && (
              <motion.span
                className="text-placeholder-text text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 1.5 }}
              >
                {unit}
              </motion.span>
            )}
          </div>
          {subtitle && (
            <motion.p
              className="text-placeholder-text text-xs opacity-70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: delay + 1.6 }}
            >
              {subtitle}
            </motion.p>
          )}
        </motion.div>
      </CardContent>
    </Card>
  )
}
