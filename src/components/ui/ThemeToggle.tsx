/**
 * ThemeToggle — cycles light / dark / system with Shiro-like micro motion.
 */

'use client'

import { motion } from 'framer-motion'
import { Monitor, Moon, Sun } from 'lucide-react'

import { pressable, springs } from '@/lib/animation'
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
      className="text-secondary-label hover:text-label focus-visible:ring-accent flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
      whileHover={pressable.whileHover}
      whileTap={pressable.whileTap}
      transition={pressable.transition}
      title={`当前: ${themeLabels[theme]}`}
      aria-label={`切换主题，当前: ${themeLabels[theme]}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -80, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={springs.snappy}
      >
        <Icon className="h-4 w-4" />
      </motion.div>
      <span className="hidden sm:inline">{themeLabels[theme]}</span>
    </motion.button>
  )
}
