/**
 * Header Component
 *
 * Glassmorphic header with seamless design
 */

'use client'

import { motion } from 'framer-motion'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="container mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <span className="text-xl">🏃</span>
          <h1 className="text-label text-lg font-semibold tracking-tight">RunPaceFlow</h1>
        </motion.div>
      </div>
    </header>
  )
}
