/**
 * Page Transition Component
 *
 * Wrapper for smooth page-level animations and transitions
 */

'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { pageVariants } from '@/lib/animation/variants'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}
