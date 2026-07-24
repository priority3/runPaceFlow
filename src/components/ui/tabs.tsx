/**
 * Tabs — glass track + spring sliding indicator (Shiro-style micro motion).
 */

'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { motion } from 'framer-motion'
import * as React from 'react'

import { pressable, springs } from '@/lib/animation'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsContext = React.createContext<{
  activeTab: string | undefined
  setActiveTab: (value: string) => void
}>({
  activeTab: undefined,
  setActiveTab: () => {},
})

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

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value)
    }
  }, [value])

  const contextValue = React.useMemo(
    () => ({ activeTab, setActiveTab: handleValueChange }),
    [activeTab, handleValueChange],
  )

  return (
    <TabsContext value={contextValue}>
      <TabsPrimitive.Root ref={ref} value={activeTab} onValueChange={handleValueChange} {...props}>
        {children}
      </TabsPrimitive.Root>
    </TabsContext>
  )
}
AnimatedTabs.displayName = 'AnimatedTabs'

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

  React.useEffect(() => {
    if (!listRef.current) return

    const timer = setTimeout(() => {
      const activeElement = listRef.current?.querySelector(`[data-state="active"]`) as HTMLElement

      if (activeElement && listRef.current) {
        const listRect = listRef.current.getBoundingClientRect()
        const activeRect = activeElement.getBoundingClientRect()
        const { scrollLeft } = listRef.current

        setIndicatorStyle({
          left: activeRect.left - listRect.left + scrollLeft,
          width: activeRect.width,
        })
      }
    }, 10)

    return () => clearTimeout(timer)
  }, [activeTab])

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
        if (typeof ref === 'function') ref(node)
        else if (ref && typeof ref === 'object')
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        listRef.current = node
      }}
      className={cn(
        'bg-secondary-system-background/70 relative inline-flex items-center gap-0.5 rounded-full p-1',
        className,
      )}
      {...props}
    >
      {indicatorStyle.width > 0 && (
        <motion.div
          className="bg-tertiary-system-background absolute top-1 bottom-1 rounded-full shadow-[0_0_0_1px_rgb(var(--color-separator))]"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={springs.snappy}
        />
      )}
      {children}
    </TabsPrimitive.List>
  )
}
TabsList.displayName = TabsPrimitive.List.displayName

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
      'relative z-10 inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors',
      'text-tertiary-label hover:text-secondary-label',
      'focus-visible:ring-accent/50 focus-visible:ring-2 focus-visible:outline-none',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:text-label',
      className,
    )}
    {...props}
  >
    <motion.span
      initial={false}
      whileHover={pressable.whileHover}
      whileTap={pressable.whileTap}
      transition={pressable.transition}
    >
      {children}
    </motion.span>
  </TabsPrimitive.Trigger>
)
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

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
      'focus-visible:ring-accent/50 mt-4 focus-visible:ring-2 focus-visible:outline-none',
      className,
    )}
    {...props}
  />
)
TabsContent.displayName = TabsPrimitive.Content.displayName

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
      'focus-visible:ring-accent/50 mt-4 focus-visible:ring-2 focus-visible:outline-none',
      className,
    )}
    {...props}
  >
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
    >
      {children}
    </motion.div>
  </TabsPrimitive.Content>
)
AnimatedTabsContent.displayName = 'AnimatedTabsContent'

export { AnimatedTabs, AnimatedTabsContent, Tabs, TabsContent, TabsList, TabsTrigger }
