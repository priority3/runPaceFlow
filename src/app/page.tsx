/**
 * Home Page - Modern Activity Dashboard
 *
 * Minimalist design inspired by Apple Fitness+
 * Features: Week/Month toggle, Sparkline trends, Map layer toggle
 */

'use client'

import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { Activity, Calendar, Clock, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { ReactNode, RefObject } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { ActivityTable } from '@/components/activity/ActivityTable'
import { StatsCard } from '@/components/activity/StatsCard'
import { Header } from '@/components/layout/Header'
import { useActivityStats, useInfiniteActivities, useMapRoutes } from '@/hooks/use-activities'
import { cn } from '@/lib/utils'
import type { RouteData } from '@/types/map'

// Lazy load heavy components to reduce initial bundle size
// Reason: MapLibre GL (~60KB gz) + react-map-gl should not block first paint
const RunMap = dynamic(
  () => import('@/components/map/RunMap').then((m) => ({ default: m.RunMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse rounded-3xl bg-gray-100 sm:h-[500px] dark:bg-gray-900" />
    ),
  },
)

const RouteLayer = dynamic(() =>
  import('@/components/map/RouteLayer').then((m) => ({ default: m.RouteLayer })),
)

// Reason: Below-the-fold components don't need eager loading
const ActivityHeatmap = dynamic(() =>
  import('@/components/activity/ActivityHeatmap').then((m) => ({ default: m.ActivityHeatmap })),
)

const PersonalRecords = dynamic(() =>
  import('@/components/activity/PersonalRecords').then((m) => ({ default: m.PersonalRecords })),
)

type StatsPeriod = 'week' | 'month'

// 目标配置（从环境变量读取，带默认值）
const GOALS = {
  weeklyDistance: Number(process.env.NEXT_PUBLIC_WEEKLY_DISTANCE_GOAL) || 10000,
  monthlyDistance: Number(process.env.NEXT_PUBLIC_MONTHLY_DISTANCE_GOAL) || 50000,
  weeklyDuration: Number(process.env.NEXT_PUBLIC_WEEKLY_DURATION_GOAL) || 3600,
  monthlyDuration: Number(process.env.NEXT_PUBLIC_MONTHLY_DURATION_GOAL) || 18000,
}

interface ParallaxSectionProps {
  children: ReactNode
  containerRef: RefObject<HTMLElement | null>
  className?: string
  fillHeight?: boolean
  disableParallax?: boolean
}

function ParallaxSection({
  children,
  containerRef,
  className,
  fillHeight = false,
  disableParallax = false,
}: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 0.5, 1], [48, 0, -48])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.99, 1, 0.99])
  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0.88, 1, 1, 0.88])

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative z-10 min-h-[calc(100dvh-4rem)] snap-start py-6 lg:py-8',
        fillHeight && 'h-[calc(100dvh-4rem)]',
        className,
      )}
    >
      <motion.div
        style={disableParallax ? undefined : { y, scale, opacity }}
        className={cn('w-full', fillHeight && 'h-full')}
      >
        {children}
      </motion.div>
    </section>
  )
}

export default function HomePage() {
  const { data: stats, isLoading: statsLoading } = useActivityStats()
  const {
    data: activitiesPages,
    isLoading: activitiesLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteActivities({ limit: 20 })
  const { data: mapRoutesData } = useMapRoutes(20)

  // UI state
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('week')
  const mainRef = useRef<HTMLElement | null>(null)
  const activityScrollRef = useRef<HTMLDivElement | null>(null)

  const activities = useMemo(
    () => activitiesPages?.pages.flatMap((page) => page.activities) ?? [],
    [activitiesPages],
  )
  const totalActivities = activitiesPages?.pages[0]?.pagination.total ?? activities.length

  const handleActivityScroll = useCallback(() => {
    const el = activityScrollRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
    if (remaining < 320) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Map routes are pre-parsed on server (coordinates extracted from GPX)
  const { routes, bounds } = useMemo(() => {
    if (!mapRoutesData || mapRoutesData.length === 0) return { routes: [], bounds: null }

    const parsedRoutes: RouteData[] = mapRoutesData
      .map((item) => ({
        id: item.id,
        coordinates: item.coordinates.map((c) => ({ latitude: c.lat, longitude: c.lng })),
        color: '#1f2937',
        width: 3,
      }))
      .filter((route) => route.coordinates.length > 0)

    if (parsedRoutes.length === 0) return { routes: parsedRoutes, bounds: null }

    const allCoords = parsedRoutes.flatMap((route) => route.coordinates)
    if (allCoords.length === 0) return { routes: parsedRoutes, bounds: null }

    const lats = allCoords.map((c) => c.latitude)
    const lons = allCoords.map((c) => c.longitude)

    return {
      routes: parsedRoutes,
      bounds: {
        minLng: Math.min(...lons),
        maxLng: Math.max(...lons),
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
      },
    }
  }, [mapRoutesData])

  // Get period-specific stats
  const periodStats = useMemo(() => {
    if (!stats) return null

    if (statsPeriod === 'week') {
      return {
        current: stats.thisWeek,
        previous: stats.lastWeek,
        label: '本周',
        compareLabel: 'vs 上周',
      }
    }
    return {
      current: stats.thisMonth,
      previous: stats.lastMonth,
      label: '本月',
      compareLabel: 'vs 上月',
    }
  }, [stats, statsPeriod])

  return (
    <div className="bg-system-background min-h-screen">
      {/* Subtle gradient overlay for glassmorphic depth */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gray-100/50 via-transparent to-gray-200/30 dark:from-gray-900/50 dark:to-gray-800/30" />

      <Header />

      <main
        ref={mainRef}
        className="scrollbar-hide relative container mx-auto h-[calc(100dvh-4rem)] max-w-6xl snap-y snap-mandatory overflow-y-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Decorative hollow "run" mark on the right background */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-32 right-[1.5rem] z-0 text-[clamp(8rem,27vw,24rem)] leading-none font-black tracking-[-0.08em] text-transparent lowercase opacity-50 select-none [-webkit-text-stroke:2.6px_rgba(17,24,39,0.08)] dark:opacity-40 dark:[-webkit-text-stroke:2.6px_rgba(255,255,255,0.12)]"
        >
          run
        </div>

        {/* Stats Section with Period Toggle */}
        <ParallaxSection containerRef={mainRef} className="flex items-center">
          {/* Period Toggle */}
          <div className="mb-6 flex items-center justify-end">
            <div className="flex items-center gap-1 rounded-lg bg-transparent p-1">
              {(['week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setStatsPeriod(period)}
                  className={cn(
                    'relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    statsPeriod === period ? 'text-label' : 'text-label/50 hover:text-label/70',
                  )}
                >
                  {statsPeriod === period && (
                    <motion.div
                      layoutId="stats-period-indicator"
                      className="border-label/15 absolute inset-0 rounded-md border bg-transparent"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{period === 'week' ? '本周' : '本月'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={`stats-skeleton-${i}`}
                  className="bg-secondary-system-background/50 h-32 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : stats && periodStats ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={statsPeriod}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-4 lg:grid-cols-4"
              >
                <StatsCard
                  title="总里程"
                  value={(stats.total.distance / 1000).toFixed(1)}
                  unit="km"
                  icon={<MapPin className="h-4 w-4" />}
                />
                <StatsCard
                  title="活动次数"
                  value={stats.total.activities}
                  unit="次"
                  icon={<Activity className="h-4 w-4" />}
                />
                <StatsCard
                  title={`${periodStats.label}里程`}
                  value={(periodStats.current.distance / 1000).toFixed(1)}
                  unit="km"
                  icon={<Calendar className="h-4 w-4" />}
                  currentValue={periodStats.current.distance}
                  previousValue={periodStats.previous.distance}
                  higherIsBetter={true}
                  goal={statsPeriod === 'week' ? GOALS.weeklyDistance : GOALS.monthlyDistance}
                  goalDisplayValue={
                    statsPeriod === 'week'
                      ? GOALS.weeklyDistance / 1000
                      : GOALS.monthlyDistance / 1000
                  }
                  goalUnit="km"
                  subtitle={periodStats.compareLabel}
                  sparklineData={stats.weeklyTrend}
                />
                <StatsCard
                  title={`${periodStats.label}时长`}
                  value={(periodStats.current.duration / 3600).toFixed(1)}
                  unit="小时"
                  icon={<Clock className="h-4 w-4" />}
                  currentValue={periodStats.current.duration}
                  previousValue={periodStats.previous.duration}
                  higherIsBetter={true}
                  goal={statsPeriod === 'week' ? GOALS.weeklyDuration : GOALS.monthlyDuration}
                  goalDisplayValue={
                    statsPeriod === 'week'
                      ? GOALS.weeklyDuration / 3600
                      : GOALS.monthlyDuration / 3600
                  }
                  goalUnit="小时"
                  subtitle={periodStats.compareLabel}
                />
              </motion.div>
            </AnimatePresence>
          ) : null}
        </ParallaxSection>

        {/* Map Section with Layer Toggle */}
        <ParallaxSection containerRef={mainRef}>
          <div className="mb-3 flex items-center justify-end">
            <span className="text-tertiary-label text-sm">
              {routes.length > 0 ? `${routes.length} 条路线` : '暂无路线数据'}
            </span>
          </div>
          <div className="border-separator/30 relative overflow-hidden rounded-3xl border bg-gray-100 shadow-sm dark:bg-gray-900">
            <div className="h-[400px] sm:h-[500px]">
              <RunMap className="h-full w-full" bounds={bounds || undefined}>
                {routes.length > 0 && <RouteLayer routes={routes} />}
              </RunMap>
            </div>
          </div>
        </ParallaxSection>

        {/* Activity Heatmap */}
        {activities.length > 0 && (
          <ParallaxSection containerRef={mainRef} className="flex items-center">
            <ActivityHeatmap activities={activities} />
          </ParallaxSection>
        )}

        {/* Personal Records */}
        {activities.length > 0 && (
          <ParallaxSection containerRef={mainRef} className="flex items-center">
            <PersonalRecords activities={activities} />
          </ParallaxSection>
        )}

        {/* Activities Section */}
        <ParallaxSection
          containerRef={mainRef}
          className="flex items-start py-0 lg:py-0"
          fillHeight={true}
          disableParallax={true}
        >
          <div className="relative h-full min-h-0 w-full">
            <div
              ref={activityScrollRef}
              className="scrollbar-hide h-full overflow-y-auto"
              onScroll={handleActivityScroll}
            >
              <div className="bg-system-background/70 sticky top-0 z-30 mb-3 flex h-11 items-center justify-end backdrop-blur-sm">
                {totalActivities > 0 && (
                  <span className="bg-secondary-system-background text-secondary-label rounded-full px-3 py-1 text-xs font-medium">
                    {activities.length} / {totalActivities}
                  </span>
                )}
              </div>

              <div
                aria-hidden="true"
                className="from-system-background/95 pointer-events-none sticky top-11 z-20 -mt-10 h-10 bg-gradient-to-b to-transparent"
              />

              {/* Error State */}
              {error && (
                <div className="border-red/20 bg-red/5 mb-6 rounded-2xl border p-6">
                  <p className="text-red font-medium">加载失败</p>
                  <p className="text-red/70 mt-1 text-sm">{error.message}</p>
                </div>
              )}

              {/* Loading State */}
              {activitiesLoading && (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={`activity-skeleton-${i}`}
                      className="bg-secondary-system-background/50 h-24 animate-pulse rounded-2xl"
                    />
                  ))}
                </div>
              )}

              {/* Activities Table */}
              {!activitiesLoading && (
                <ActivityTable
                  activities={activities}
                  className="relative z-10"
                  virtualized={true}
                  scrollRef={activityScrollRef}
                />
              )}

              {!activitiesLoading && isFetchingNextPage && (
                <div className="text-secondary-label/70 mb-4 flex items-center justify-center text-xs">
                  加载更多...
                </div>
              )}

              <div
                aria-hidden="true"
                className="from-system-background/95 pointer-events-none sticky bottom-0 z-20 -mt-14 h-14 bg-gradient-to-t to-transparent"
              />
            </div>
          </div>
        </ParallaxSection>
      </main>
    </div>
  )
}
