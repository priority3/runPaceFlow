/**
 * Header Component
 *
 * Minimal, modern header design with scroll effects
 */

'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()

  // Transform scroll to blur and opacity values
  const headerBlur = useTransform(scrollY, [0, 50], [0, 20])
  const headerOpacity = useTransform(scrollY, [0, 50], [0.8, 0.95])
  const logoScale = useTransform(scrollY, [0, 100], [1, 0.9])
  const borderOpacity = useTransform(scrollY, [0, 50], [0.2, 0.5])

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setIsScrolled(latest > 20)
    })
    return () => unsubscribe()
  }, [scrollY])

  return (
    <motion.header
      className="border-separator bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-xl"
      style={{
        backdropFilter: useTransform(headerBlur, (v) => `blur(${v}px)`),
        backgroundColor: useTransform(
          headerOpacity,
          (v) => `rgba(var(--background-rgb), ${v})`
        ),
        borderBottomColor: useTransform(
          borderOpacity,
          (v) => `rgba(var(--separator-rgb), ${v})`
        ),
      }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="container mx-auto flex h-20 max-w-[1600px] items-center px-8">
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            className="bg-primary flex size-12 items-center justify-center rounded-2xl"
            style={{ scale: logoScale }}
            whileHover={{
              scale: 1.1,
              rotate: [0, -10, 10, -10, 0],
              transition: {
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1],
              },
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className="text-2xl"
              animate={
                isScrolled
                  ? {}
                  : {
                      scale: [1, 1.2, 1],
                      transition: {
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                      },
                    }
              }
            >
              🏃
            </motion.span>
          </motion.div>
          <motion.h1
            className="text-text text-2xl font-bold tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            RunPaceFlow
          </motion.h1>
        </motion.div>
      </div>
    </motion.header>
  )
}
