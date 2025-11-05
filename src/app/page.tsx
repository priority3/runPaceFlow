/**
 * Home Page - Activity List with Map
 *
 * Main page displaying all running activities with stats and map
 */

'use client'

import { Header } from '@/components/layout/Header'
import { StatsCard } from '@/components/activity/StatsCard'
import { ActivityCard } from '@/components/activity/ActivityCard'
import { PaceChart } from '@/components/activity/PaceChart'
import { SplitsTable } from '@/components/activity/SplitsTable'
import { RunMap } from '@/components/map/RunMap'
import { RouteLayer } from '@/components/map/RouteLayer'
import { PaceRouteLayer } from '@/components/map/PaceRouteLayer'
import { KilometerMarkers } from '@/components/map/KilometerMarkers'
import { AnimatedRoute } from '@/components/map/AnimatedRoute'
import { FloatingInfoCard } from '@/components/map/FloatingInfoCard'
import { useActivities, useActivityStats } from '@/hooks/use-activities'
import type { RouteData } from '@/types/map'
import { useMemo, useState } from 'react'
import { useAtom } from 'jotai'
import { playingActivityIdAtom, isPlayingAtom, animationProgressAtom } from '@/stores/map'
import { generateMockTrackPoints } from '@/lib/map/mock-data'
import { createPaceSegments, createKilometerMarkers } from '@/lib/map/pace-utils'

export default function HomePage() {
  const { data: stats, isLoading: statsLoading } = useActivityStats()
  const { data: activitiesData, isLoading: activitiesLoading, error } = useActivities({ limit: 20 })

  // 全局播放状态
  const [playingActivityId, setPlayingActivityId] = useAtom(playingActivityIdAtom)
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom)
  const [animationProgress, setAnimationProgress] = useAtom(animationProgressAtom)

  // 切换是否显示配速演示
  const [showPaceDemo, setShowPaceDemo] = useState(true)

  // Parse GPX data to routes for map display
  const routes: RouteData[] = useMemo(() => {
    if (!activitiesData?.activities) return []

    return activitiesData.activities
      .filter((activity) => activity.gpxData)
      .map((activity) => ({
        id: activity.id,
        coordinates: parseGPXCoordinates(activity.gpxData || ''),
        color: '#3b82f6',
        width: 3,
      }))
      .filter((route) => route.coordinates.length > 0)
  }, [activitiesData])

  // 生成模拟配速数据用于演示
  const { paceSegments, kmMarkers, trackPoints, splits } = useMemo(() => {
    if (!showPaceDemo) return { paceSegments: [], kmMarkers: [], trackPoints: [], splits: [] }

    const points = generateMockTrackPoints()
    const averagePace = 360 // 6:00/km
    const markers = createKilometerMarkers(points)

    // 从 kmMarkers 生成 splits 数据
    const splitsData = markers.map((marker, index) => {
      const prevMarker = index > 0 ? markers[index - 1] : { distance: 0, pace: marker.pace }
      const distance = marker.distance - prevMarker.distance
      const duration = (marker.pace / 1000) * distance

      return {
        kilometer: marker.kilometer,
        pace: marker.pace,
        distance: distance,
        duration: duration,
      }
    })

    return {
      paceSegments: createPaceSegments(points, averagePace, 50),
      kmMarkers: markers,
      trackPoints: points,
      splits: splitsData,
    }
  }, [showPaceDemo])

  // 获取当前回放点
  const currentPoint = useMemo(() => {
    if (!trackPoints.length || animationProgress === 0) return undefined
    const index = Math.floor((animationProgress / 100) * trackPoints.length)
    return trackPoints[Math.min(index, trackPoints.length - 1)]
  }, [trackPoints, animationProgress])

  // 播放/暂停控制
  const handlePlayPause = () => {
    if (!playingActivityId) {
      // 开始播放演示
      setPlayingActivityId('demo')
      setIsPlaying(true)
    } else {
      // 切换播放/暂停
      setIsPlaying(!isPlaying)
    }
  }

  // 动画完成回调
  const handleAnimationComplete = () => {
    setIsPlaying(false)
    setAnimationProgress(100)
  }

  // 停止播放
  const handleStopPlayback = () => {
    setPlayingActivityId(null)
    setIsPlaying(false)
    setAnimationProgress(0)
  }

  return (
    <div className="min-h-screen bg-systemBackground">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-screen-2xl">
        {/* Stats Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-label">统计数据</h2>
          {statsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl bg-fill"
                />
              ))}
            </div>
          ) : stats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="总里程"
                value={(stats.total.distance / 1000).toFixed(1)}
                unit="km"
              />
              <StatsCard
                title="总活动"
                value={stats.total.activities}
                unit="次"
              />
              <StatsCard
                title="本周里程"
                value={(stats.thisWeek.distance / 1000).toFixed(1)}
                unit="km"
                subtitle={`${stats.thisWeek.activities} 次活动`}
              />
              <StatsCard
                title="总时长"
                value={(stats.total.duration / 3600).toFixed(1)}
                unit="小时"
              />
            </div>
          ) : null}
        </section>

        {/* Pace Analysis Section */}
        {showPaceDemo && splits.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-label">配速分析演示</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Pace Chart */}
              <div className="rounded-xl border border-separator bg-secondarySystemBackground p-6">
                <h3 className="mb-4 text-lg font-semibold text-label">每公里配速</h3>
                <PaceChart splits={splits} averagePace={360} />
              </div>

              {/* Splits Table */}
              <div className="rounded-xl border border-separator bg-secondarySystemBackground p-6">
                <h3 className="mb-4 text-lg font-semibold text-label">分段数据</h3>
                <SplitsTable splits={splits} />
              </div>
            </div>
          </section>
        )}

        {/* Main Content: Activities List + Map */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Activities Section */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-label">最近活动</h2>

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red bg-red/10 p-4 text-red">
                <p className="font-medium">加载失败</p>
                <p className="text-sm">{error.message}</p>
              </div>
            )}

            {/* Loading State */}
            {activitiesLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-48 animate-pulse rounded-xl bg-fill"
                  />
                ))}
              </div>
            )}

            {/* Activities List */}
            {activitiesData && !activitiesLoading && (
              <>
                {activitiesData.activities.length === 0 ? (
                  <div className="rounded-lg border border-separator bg-secondarySystemBackground p-8 text-center">
                    <p className="text-lg text-secondaryLabel">还没有活动记录</p>
                    <p className="mt-2 text-sm text-tertiaryLabel">
                      同步 Nike Run Club 数据后，活动将显示在这里
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activitiesData.activities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        id={activity.id}
                        title={activity.title || '跑步活动'}
                        type={activity.type}
                        startTime={activity.startTime}
                        duration={activity.duration}
                        distance={activity.distance}
                        averagePace={activity.averagePace || undefined}
                        elevationGain={activity.elevationGain || undefined}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination Info */}
                {activitiesData.pagination.total > 0 && (
                  <div className="mt-6 text-center text-sm text-tertiaryLabel">
                    显示 {activitiesData.activities.length} / {activitiesData.pagination.total} 个活动
                  </div>
                )}
              </>
            )}
          </section>

          {/* Map Section */}
          <section className="lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-2xl font-bold text-label">路线地图</h2>
              <div className="flex items-center gap-2">
                {/* 播放演示按钮 */}
                {showPaceDemo && (
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    className="rounded-lg border border-separator bg-blue px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue/90"
                  >
                    {playingActivityId === 'demo' && isPlaying ? '暂停演示' : '播放演示'}
                  </button>
                )}
                {/* 停止按钮 */}
                {playingActivityId && (
                  <button
                    type="button"
                    onClick={handleStopPlayback}
                    className="rounded-lg border border-separator bg-fill px-3 py-1.5 text-sm text-secondaryLabel transition-colors hover:bg-secondaryFill"
                  >
                    停止
                  </button>
                )}
                {/* 配速演示切换 */}
                <button
                  type="button"
                  onClick={() => {
                    setShowPaceDemo(!showPaceDemo)
                    if (showPaceDemo) handleStopPlayback()
                  }}
                  className="rounded-lg border border-separator bg-fill px-3 py-1.5 text-sm text-secondaryLabel transition-colors hover:bg-secondaryFill"
                >
                  {showPaceDemo ? '隐藏演示' : '显示演示'}
                </button>
              </div>
            </div>
            <div className="relative h-[500px] overflow-hidden rounded-xl border border-separator lg:h-full">
              <RunMap className="h-full w-full">
                {/* 显示普通路线 */}
                {routes.length > 0 && !playingActivityId && <RouteLayer routes={routes} />}

                {/* 显示配速演示路线（静态） */}
                {showPaceDemo && paceSegments.length > 0 && !playingActivityId && (
                  <>
                    <PaceRouteLayer segments={paceSegments} activityId="demo" />
                    <KilometerMarkers markers={kmMarkers} />
                  </>
                )}

                {/* 显示动画回放 */}
                {playingActivityId === 'demo' && paceSegments.length > 0 && (
                  <AnimatedRoute
                    segments={paceSegments}
                    activityId="demo"
                    isPlaying={isPlaying}
                    onProgressChange={setAnimationProgress}
                    onAnimationComplete={handleAnimationComplete}
                    speed={1.5}
                  />
                )}
              </RunMap>

              {/* 浮动信息卡 */}
              {playingActivityId === 'demo' && currentPoint && (
                <FloatingInfoCard
                  currentPoint={currentPoint}
                  averagePace={360}
                  isPlaying={isPlaying}
                  progress={animationProgress}
                  onPlayPause={handlePlayPause}
                />
              )}
            </div>
          </section>
        </div>
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
  // In Week 1, we have the parser in src/lib/sync/parser.ts
  return []
}
