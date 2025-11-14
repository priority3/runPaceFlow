/**
 * Home Page - Modern Activity Dashboard
 *
 * Clean, modern design inspired by cyc.earth with smooth animations
 */

'use client'

import { useMemo } from 'react'

import { ActivityTable } from '@/components/activity/ActivityTable'
import { StatsCard } from '@/components/activity/StatsCard'
import { Header } from '@/components/layout/Header'
import { RouteLayer } from '@/components/map/RouteLayer'
import { RunMap } from '@/components/map/RunMap'
import { SyncStatusCard } from '@/components/sync/SyncStatusCard'
import { useActivities, useActivityStats } from '@/hooks/use-activities'
import type { Activity } from '@/types/activity'
import type { RouteData } from '@/types/map'

export default function HomePage() {
  const { data: stats, isLoading: statsLoading } = useActivityStats()
  const { data: activitiesData, isLoading: activitiesLoading, error } = useActivities({ limit: 20 })

  // Parse GPX data to routes for map display
  const routes: RouteData[] = useMemo(() => {
    if (!activitiesData?.activities) return []

    return activitiesData.activities
      .filter((activity: Activity) => activity.gpxData)
      .map((activity: Activity) => ({
        id: activity.id,
        coordinates: parseGPXCoordinates(activity.gpxData || ''),
        color: '#3b82f6',
        width: 3,
      }))
      .filter((route: RouteData) => route.coordinates.length > 0)
  }, [activitiesData])

  return (
    <div className="bg-system-background min-h-screen">
      <Header />

      <main className="container mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Hero Section with Sync Status */}
        <section className="mb-8 lg:mb-12">
          <div className="flex flex-col gap-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-label text-3xl font-bold tracking-tight sm:text-4xl">
                  RunPaceFlow
                </h1>
                <p className="text-secondary-label mt-1 text-sm sm:text-base">跑步数据分析平台</p>
              </div>
            </div>

            {/* Sync Status - Enhanced Design */}
            <SyncStatusCard />
          </div>
        </section>

        {/* Stats Grid - Enhanced with Progress Bars */}
        <section className="mb-8 lg:mb-12">
          {statsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-secondary-system-fill h-28 animate-pulse rounded-2xl sm:h-32"
                />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8">
              <StatsCard
                title="总里程"
                value={(stats.total.distance / 1000).toFixed(1)}
                unit="km"
                delay={0}
              />
              <StatsCard title="活动" value={stats.total.activities} unit="次" delay={0.1} />
              <StatsCard
                title="本周里程"
                value={(stats.thisWeek.distance / 1000).toFixed(1)}
                unit="km"
                delay={0.2}
              />
              <StatsCard
                title="总时长"
                value={(stats.total.duration / 3600).toFixed(1)}
                unit="小时"
                delay={0.3}
              />
            </div>
          ) : null}
        </section>

        {/* Map Section - Enhanced with Shadow */}
        <section className="mb-8 lg:mb-12">
          <div className="relative h-[50vh] min-h-[400px] overflow-hidden rounded-2xl shadow-lg sm:h-[60vh] sm:min-h-[500px] lg:h-[65vh] lg:min-h-[600px] lg:rounded-3xl">
            <RunMap className="h-full w-full">
              {routes.length > 0 && <RouteLayer routes={routes} />}
            </RunMap>
          </div>
        </section>

        {/* Activities Section - Card Layout */}
        <section>
          <div className="mb-6 flex items-center justify-between lg:mb-8">
            <div>
              <h2 className="text-label text-xl font-semibold sm:text-2xl">最近活动</h2>
              <p className="text-secondary-label mt-1 text-sm">查看你的跑步记录</p>
            </div>
            {activitiesData && activitiesData.pagination.total > 0 && (
              <div className="text-tertiary-label text-xs sm:text-sm">
                {activitiesData.activities.length} / {activitiesData.pagination.total}
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="border-red/20 bg-red/10 text-red mb-6 rounded-2xl border p-6 lg:mb-8">
              <p className="font-semibold">加载失败</p>
              <p className="mt-1 text-sm opacity-80">{error.message}</p>
            </div>
          )}

          {/* Loading State */}
          {activitiesLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-secondary-system-fill h-32 animate-pulse rounded-2xl" />
              ))}
            </div>
          )}

          {/* Activities Table */}
          {activitiesData && !activitiesLoading && (
            <ActivityTable activities={activitiesData.activities} />
          )}
        </section>
      </main>
    </div>
  )
}

/**
 * Parse GPX data to extract coordinates
 * TODO: Implement proper GPX parsing when GPX data is available
 */
function parseGPXCoordinates(_gpxData: string): Array<{ longitude: number; latitude: number }> {
  // Placeholder: Return empty array until GPX parsing is implemented
  return []
}
