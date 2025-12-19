/**
 * StatsCard Component
 *
 * Glassmorphic design with backdrop blur and subtle transparency
 */

'use client'

import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'

import { cn } from '@/lib/utils'

export interface StatsCardProps {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  className?: string
  icon?: React.ReactNode
  animateNumber?: boolean
  delay?: number
}

export function StatsCard({
  title,
  value,
  unit,
  subtitle,
  className,
  icon,
  animateNumber = true,
  delay = 0,
}: StatsCardProps) {
  const motionValue = useMotionValue(0)

  const numericValue = typeof value === 'number' ? value : Number.parseFloat(String(value))
  const isNumeric = !Number.isNaN(numericValue)
  const hasDecimals = isNumeric && numericValue % 1 !== 0

  const displayValue = useTransform(motionValue, (latest) =>
    hasDecimals ? latest.toFixed(1) : Math.round(latest).toString(),
  )

  useEffect(() => {
    if (isNumeric && animateNumber) {
      motionValue.set(0)
      const controls = animate(motionValue, numericValue, {
        duration: 1.2,
        delay,
        ease: [0.22, 1, 0.36, 1],
      })
      return controls.stop
    }
    return
  }, [numericValue, motionValue, animateNumber, delay, isNumeric])

  return (
    <motion.div
      className={cn(
        'group relative rounded-2xl p-5 sm:p-6',
        'bg-white/60 dark:bg-black/20',
        'backdrop-blur-xl backdrop-saturate-150',
        'border border-white/20 dark:border-white/10',
        'shadow-sm shadow-black/5',
        'transition-all duration-300',
        'hover:bg-white/70 dark:hover:bg-black/30',
        'hover:shadow-md hover:shadow-black/10',
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-label/60 text-xs font-medium tracking-wider uppercase">{title}</span>
        {icon && <span className="text-label/40">{icon}</span>}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        {isNumeric && animateNumber ? (
          <motion.span className="text-label text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {displayValue}
          </motion.span>
        ) : (
          <span className="text-label text-3xl font-semibold tracking-tight sm:text-4xl">
            {value}
          </span>
        )}
        {unit && (
          <motion.span
            className="text-label/50 text-sm font-medium sm:text-base"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay * 0.1 + 0.8, duration: 0.3 }}
          >
            {unit}
          </motion.span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          className="text-label/40 mt-2 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay * 0.1 + 1 }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}
