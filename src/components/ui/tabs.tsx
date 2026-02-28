/**
 * Tabs Component
 *
 * Glassmorphic tabs with smooth sliding indicator animation
 */

'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { motion } from 'framer-motion'
import * as React from 'react'

import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

/**
 * Context for sharing active tab state with indicator
 */
const TabsContext = React.createContext<{
  activeTab: string | undefined
  setActiveTab: (value: string) => void
}>({
  activeTab: undefined,
  setActiveTab: () => {},
})

/**
 * Enhanced Tabs root with state management for indicator
 */
const AnimatedTabs = ({
  ref,
  defaultValue,
  value,
  onValueChange,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & {
  ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.Root> | null>
}) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue)

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      setActiveTab(newValue)
      onValueChange?.(newValue)
    },
    [onValueChange],
  )

  // Sync with controlled value
  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value)
    }
  }, [value])

  return (
    <TabsContext value={{ activeTab, setActiveTab: handleValueChange }}>
      <TabsPrimitive.Root ref={ref} value={activeTab} onValueChange={handleValueChange} {...props}>
        {children}
      </TabsPrimitive.Root>
    </TabsContext>
  )
}
AnimatedTabs.displayName = 'AnimatedTabs'

/**
 * TabsList with sliding indicator
 */
const TabsList = ({
  ref,
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
  ref?: React.Ref<HTMLDivElement>
}) => {
  const { activeTab } = React.use(TabsContext)
  const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 })
  const listRef = React.useRef<HTMLDivElement>(null)

  // Update indicator position when active tab changes
  React.useEffect(() => {
    if (!listRef.current) return

    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      const activeElement = listRef.current?.querySelector(`[data-state="active"]`) as HTMLElement

      if (activeElement && listRef.current) {
        const listRect = listRef.current.getBoundingClientRect()
        const activeRect = activeElement.getBoundingClientRect()
        // Account for scroll position when calculating left offset
        const { scrollLeft } = listRef.current

        setIndicatorStyle({
          left: activeRect.left - listRect.left + scrollLeft,
          width: activeRect.width,
        })
      }
    }, 10)

    return () => clearTimeout(timer)
  }, [activeTab])

  // Also update indicator when scrolling
  React.useEffect(() => {
    const list = listRef.current
    if (!list) return

    const handleScroll = () => {
      const activeElement = list.querySelector(`[data-state="active"]`) as HTMLElement
      if (activeElement) {
        const listRect = list.getBoundingClientRect()
        const activeRect = activeElement.getBoundingClientRect()
        const { scrollLeft } = list

        setIndicatorStyle({
          left: activeRect.left - listRect.left + scrollLeft,
          width: activeRect.width,
        })
      }
    }

    list.addEventListener('scroll', handleScroll)
    return () => list.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <TabsPrimitive.List
      ref={(node) => {
        // Handle both refs
        if (typeof ref === 'function') ref(node)
        else if (ref && typeof ref === 'object')
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        listRef.current = node
      }}
      className={cn(
        'relative inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/40 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-black/20',
        className,
      )}
      {...props}
    >
      {/* Sliding indicator */}
      {indicatorStyle.width > 0 && (
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-white/60 shadow-sm dark:bg-white/10"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        />
      )}
      {children}
    </TabsPrimitive.List>
  )
}
TabsList.displayName = TabsPrimitive.List.displayName

/**
 * TabsTrigger with hover animation
 */
const TabsTrigger = ({
  ref,
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.Trigger> | null>
}) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative z-10 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
      'text-label/60 hover:text-label/80',
      'focus-visible:ring-blue/50 focus-visible:ring-2 focus-visible:outline-none',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:text-label',
      className,
    )}
    {...props}
  >
    <motion.span
      initial={false}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.span>
  </TabsPrimitive.Trigger>
)
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/**
 * Basic TabsContent
 */
const TabsContent = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.Content> | null>
}) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'focus-visible:ring-blue/50 mt-4 focus-visible:ring-2 focus-visible:outline-none',
      className,
    )}
    {...props}
  />
)
TabsContent.displayName = TabsPrimitive.Content.displayName

/**
 * Animated TabsContent with fade transition
 * Wraps content in motion.div for entry animation
 */
const AnimatedTabsContent = ({
  ref,
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.Content> | null>
}) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'focus-visible:ring-blue/50 mt-4 focus-visible:ring-2 focus-visible:outline-none',
      className,
    )}
    {...props}
  >
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 30,
      }}
    >
      {children}
    </motion.div>
  </TabsPrimitive.Content>
)
AnimatedTabsContent.displayName = 'AnimatedTabsContent'

export { AnimatedTabs, AnimatedTabsContent, Tabs, TabsContent, TabsList, TabsTrigger }
