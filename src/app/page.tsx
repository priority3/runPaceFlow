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
import { NikeSyncButton } from '@/components/sync/NikeSyncButton'
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
    <div className="bg-background min-h-screen">
      <Header />

      <main className="container mx-auto max-w-[1600px] px-8 py-10">
        {/* User Profile Section */}
        <div className="mb-12 flex items-center justify-between">
          <NikeSyncButton onSyncComplete={() => window.location.reload()} />
        </div>

        {/* Stats Grid - Animated Design */}
        <section className="mb-12">
          {statsLoading ? (
            <div className="grid grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-fill h-28 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-4 gap-8">
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

        {/* Large Map Section */}
        <section className="mb-12">
          <div className="relative h-[65vh] min-h-[600px] overflow-hidden rounded-3xl">
            <RunMap className="h-full w-full">
              {routes.length > 0 && <RouteLayer routes={routes} />}
            </RunMap>
          </div>
        </section>

        {/* Activities Table */}
        <section>
          <div className="mb-8">
            <h2 className="text-text text-2xl font-semibold">活动名称</h2>
          </div>

          {/* Error State */}
          {error && (
            <div className="border-red/20 bg-red/10 text-red mb-8 rounded-2xl border p-6">
              <p className="font-semibold">加载失败</p>
              <p className="mt-1 text-sm opacity-80">{error.message}</p>
            </div>
          )}

          {/* Loading State */}
          {activitiesLoading && <div className="bg-fill h-96 animate-pulse rounded-2xl" />}

          {/* Activities Table */}
          {activitiesData && !activitiesLoading && (
            <>
              <ActivityTable activities={activitiesData.activities} />

              {/* Pagination Info */}
              {activitiesData.pagination.total > 0 && (
                <div className="text-placeholder-text mt-8 text-center text-sm">
                  显示 {activitiesData.activities.length} / {activitiesData.pagination.total} 个活动
                </div>
              )}
            </>
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
