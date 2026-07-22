/**
 * ThemeToggle Component
 *
 * Button to toggle between light/dark/system themes
 */

'use client'

import { motion } from 'framer-motion'
import { Monitor, Moon, Sun } from 'lucide-react'

import type { Theme } from '@/lib/theme'
import { useTheme } from '@/lib/theme'

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const themeLabels = {
  light: '浅色',
  dark: '深色',
  system: '跟随系统',
}

const themeOrder: Theme[] = ['light', 'dark', 'system']

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
  }

  const Icon = themeIcons[theme]

  return (
    <motion.button
      type="button"
      onClick={cycleTheme}
      className="border-separator bg-tertiary-system-background hover:bg-secondary-system-background focus-visible:ring-blue/40 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={`当前: ${themeLabels[theme]}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="text-label h-4 w-4" />
      </motion.div>
      <span className="text-label/70 hidden sm:inline">{themeLabels[theme]}</span>
    </motion.button>
  )
}
