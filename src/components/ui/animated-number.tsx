/**
 * AnimatedNumber Component
 *
 * Smooth number animation with spring physics
 */

'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

export interface AnimatedNumberProps {
  value: number
  /** Number of decimal places */
  decimals?: number
  /** Animation duration in seconds */
  duration?: number
  className?: string
}

export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 0.8,
  className,
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration,
  })

  const display = useTransform(spring, (current) => current.toFixed(decimals))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span className={className}>{display}</motion.span>
}
