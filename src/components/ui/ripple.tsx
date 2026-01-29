/**
 * Ripple Effect Component
 *
 * Material Design inspired ripple animation for click feedback
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import * as React from 'react'

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

export interface RippleContainerProps {
  children: React.ReactNode
  className?: string
  color?: string
  duration?: number
  disabled?: boolean
}

export function RippleContainer({
  children,
  className = '',
  color = 'rgba(0, 0, 0, 0.1)',
  duration = 0.6,
  disabled = false,
}: RippleContainerProps) {
  const [ripples, setRipples] = React.useState<Ripple[]>([])
  const containerRef = React.useRef<HTMLDivElement>(null)

  const addRipple = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Calculate ripple size to cover the entire container
      const size = Math.max(rect.width, rect.height) * 2

      const newRipple: Ripple = {
        id: Date.now(),
        x,
        y,
        size,
      }

      setRipples((prev) => [...prev, newRipple])

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
      }, duration * 1000)
    },
    [disabled, duration],
  )

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseDown={addRipple}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
