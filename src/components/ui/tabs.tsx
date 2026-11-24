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
        // pr-ui：导航当前项用字重 + 1px 墨线，不用底色块、不用胶囊
        'border-separator relative inline-flex items-center gap-1 border-b',
        className,
      )}
      {...props}
    >
      {indicatorStyle.width > 0 && (
        <motion.div
          className="absolute -bottom-px h-px bg-[rgb(var(--color-label))]"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
      'relative z-10 inline-flex items-center justify-center px-3 py-2 text-[13px] whitespace-nowrap transition-colors',
      'text-tertiary-label hover:text-secondary-label',
      'focus-visible:outline-label focus-visible:outline-2 focus-visible:outline-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:text-label data-[state=active]:font-medium',
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
      'focus-visible:outline-label mt-6 focus-visible:outline-2 focus-visible:outline-offset-2',
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
      'focus-visible:outline-label mt-6 focus-visible:outline-2 focus-visible:outline-offset-2',
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
