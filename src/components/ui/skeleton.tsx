/**
 * Skeleton Component
 *
 * Animated loading skeleton with shimmer effect
 * Respects user's reduced motion preferences
 */

'use client'

import { motion } from 'framer-motion'

import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { shimmerVariants } from '@/lib/animation/variants'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variant style for different use cases
   * @default 'default'
   */
  variant?: 'default' | 'text' | 'circular' | 'rectangular'
  /**
   * Width of the skeleton
   */
  width?: string | number
  /**
   * Height of the skeleton
   */
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  onAnimationStart,
  onAnimationEnd,
  ...props
}: SkeletonProps) {
  const prefersReducedMotion = useReducedMotion()

  const styles = {
    width: width || undefined,
    height: height || undefined,
  }

  const baseClasses = 'relative overflow-hidden bg-fill'

  const variantClasses = {
    default: 'rounded-xl',
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
  }

  // Use simple pulse for reduced motion
  if (prefersReducedMotion) {
    return (
      <div
        className={cn(baseClasses, variantClasses[variant], 'animate-pulse', className)}
        style={styles}
        {...props}
      />
    )
  }

  return (
    <motion.div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={styles}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      {...(props as any)}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        }}
        animate={{
          x: ['0%', '200%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  )
}

/**
 * Skeleton Group - for common skeleton patterns
 */
export function SkeletonGroup({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

/**
 * Card Skeleton - matches StatsCard/ActivityCard layout
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('border-separator bg-fill rounded-2xl border p-6', className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

/**
 * Table Row Skeleton
 */
export function SkeletonTableRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 py-4', className)}>
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/6" />
      <Skeleton className="h-4 w-1/6" />
      <Skeleton className="h-4 w-1/6" />
      <Skeleton className="h-4 w-1/6" />
    </div>
  )
}
