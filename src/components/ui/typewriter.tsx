/**
 * Typewriter Component
 *
 * Animated text reveal with typewriter effect for AI-generated content
 */

'use client'

import { motion, useMotionValue, animate } from 'framer-motion'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TypewriterProps {
  /** The text content to animate */
  text: string
  /** Speed in characters per second (default: 30) */
  speed?: number
  /** Delay before starting in ms (default: 0) */
  delay?: number
  /** Whether to show cursor (default: true) */
  showCursor?: boolean
  /** Callback when animation completes */
  onComplete?: () => void
  /** Skip animation and show full text */
  skipAnimation?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Typewriter effect for text content
 * Reveals text character by character with optional cursor
 */
export function Typewriter({
  text,
  speed = 30,
  delay = 0,
  showCursor = true,
  onComplete,
  skipAnimation = false,
  className,
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = React.useState(skipAnimation ? text : '')
  const [isComplete, setIsComplete] = React.useState(skipAnimation)

  React.useEffect(() => {
    if (skipAnimation) {
      setDisplayedText(text)
      setIsComplete(true)
      onComplete?.()
      return
    }

    setDisplayedText('')
    setIsComplete(false)

    const timeout = setTimeout(() => {
      let currentIndex = 0

      const interval = setInterval(() => {
        currentIndex++
        setDisplayedText(text.slice(0, currentIndex))

        if (currentIndex >= text.length) {
          clearInterval(interval)
          setIsComplete(true)
          onComplete?.()
        }
      }, 1000 / speed)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timeout)
  }, [text, speed, delay, skipAnimation, onComplete])

  return (
    <span className={cn('inline', className)}>
      {displayedText}
      {showCursor && !isComplete && (
        <motion.span
          className="bg-purple ml-0.5 inline-block h-[1.1em] w-[2px] align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        />
      )}
    </span>
  )
}

export interface TypewriterMarkdownProps {
  /** The markdown content to animate */
  content: string
  /** Speed in characters per second (default: 50) */
  speed?: number
  /** Delay before starting in ms (default: 0) */
  delay?: number
  /** Callback when animation completes */
  onComplete?: () => void
  /** Skip animation and show full content */
  skipAnimation?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Typewriter effect for markdown content
 * Progressively reveals content while maintaining markdown structure
 */
export function TypewriterMarkdown({
  content,
  speed = 50,
  delay = 0,
  onComplete,
  skipAnimation = false,
  className,
}: TypewriterMarkdownProps) {
  const [visibleLength, setVisibleLength] = React.useState(skipAnimation ? content.length : 0)
  const [isComplete, setIsComplete] = React.useState(skipAnimation)

  React.useEffect(() => {
    if (skipAnimation) {
      setVisibleLength(content.length)
      setIsComplete(true)
      onComplete?.()
      return
    }

    setVisibleLength(0)
    setIsComplete(false)

    const timeout = setTimeout(() => {
      let currentLength = 0

      const interval = setInterval(() => {
        // Reason: Skip whitespace and markdown syntax faster for smoother reading
        let increment = 1
        const nextChar = content[currentLength]
        if (nextChar === ' ' || nextChar === '\n' || nextChar === '#' || nextChar === '*') {
          increment = 2
        }

        currentLength = Math.min(currentLength + increment, content.length)
        setVisibleLength(currentLength)

        if (currentLength >= content.length) {
          clearInterval(interval)
          setIsComplete(true)
          onComplete?.()
        }
      }, 1000 / speed)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timeout)
  }, [content, speed, delay, skipAnimation, onComplete])

  // Get visible content, ensuring we don't break markdown syntax
  const visibleContent = React.useMemo(() => {
    if (visibleLength >= content.length) return content

    let endIndex = visibleLength

    // Reason: Avoid cutting in the middle of markdown syntax
    // Find a safe break point (end of word or line)
    while (endIndex > 0 && content[endIndex] !== ' ' && content[endIndex] !== '\n') {
      if (endIndex === visibleLength - 10) break // Don't go back too far
      endIndex--
    }

    // If we couldn't find a good break, just use the original length
    if (endIndex === 0) endIndex = visibleLength

    return content.slice(0, endIndex)
  }, [content, visibleLength])

  return (
    <div className={cn('relative', className)}>
      <div className="whitespace-pre-wrap">{visibleContent}</div>
      {!isComplete && (
        <motion.span
          className="bg-purple inline-block h-4 w-[2px] align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        />
      )}
    </div>
  )
}

/**
 * Hook for typewriter animation control
 */
export function useTypewriter(text: string, speed = 30) {
  const progress = useMotionValue(0)
  const [displayedText, setDisplayedText] = React.useState('')

  React.useEffect(() => {
    const duration = text.length / speed

    const controls = animate(progress, 1, {
      duration,
      ease: 'linear',
      onUpdate: (latest) => {
        const length = Math.round(latest * text.length)
        setDisplayedText(text.slice(0, length))
      },
    })

    return () => controls.stop()
  }, [text, speed, progress])

  return {
    displayedText,
    progress,
    isComplete: displayedText.length >= text.length,
  }
}
