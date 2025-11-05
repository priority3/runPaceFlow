/**
 * Activity Detail Page
 *
 * Displays full details of a single activity with map, charts, and splits
 */

'use client'

import { useAtom } from 'jotai'
import { ArrowLeft, Pause, Play } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { PaceChart } from '@/components/activity/PaceChart'
import { SplitsTable } from '@/components/activity/SplitsTable'
import { StatsCard } from '@/components/activity/StatsCard'
import { AnimatedRoute } from '@/components/map/AnimatedRoute'
import { FloatingInfoCard } from '@/components/map/FloatingInfoCard'
import { KilometerMarkers } from '@/components/map/KilometerMarkers'
import { PaceRouteLayer } from '@/components/map/PaceRouteLayer'
import { RunMap } from '@/components/map/RunMap'
import { Button } from '@/components/ui/button'
import { useActivityWithSplits } from '@/hooks/use-activities'
import { generateMockTrackPoints } from '@/lib/map/mock-data'
import { createKilometerMarkers, createPaceSegments } from '@/lib/map/pace-utils'
import { formatDuration, formatPace } from '@/lib/pace/calculator'
import { formatDate, formatTime } from '@/lib/utils'
import { animationProgressAtom, isPlayingAtom } from '@/stores/map'
import type { Split } from '@/types/activity'

export default function ActivityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const activityId = params.id as string

  // Fetch activity data with splits
  const { data, isLoading, error } = useActivityWithSplits(activityId)

  // Playback state
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom)
  const [animationProgress, setAnimationProgress] = useAtom(animationProgressAtom)

  // Generate mock data for demo (since we don't have real GPX data yet)
  const { paceSegments, kmMarkers, trackPoints } = useMemo(() => {
    // TODO: Replace with real GPX parsing when data is available
    const points = generateMockTrackPoints()
    const averagePace = data?.activity.averagePace || 360

    return {
      paceSegments: createPaceSegments(points, averagePace, 50),
      kmMarkers: createKilometerMarkers(points),
      trackPoints: points,
    }
  }, [data])

  // Get current point for animation
  const currentPoint = useMemo(() => {
    if (trackPoints.length === 0 || animationProgress === 0) return
    const index = Math.floor((animationProgress / 100) * trackPoints.length)
    return trackPoints[Math.min(index, trackPoints.length - 1)]
  }, [trackPoints, animationProgress])

  // Playback controls
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleStopPlayback = () => {
    setIsPlaying(false)
    setAnimationProgress(0)
  }

  const handleAnimationComplete = () => {
    setIsPlaying(false)
    setAnimationProgress(100)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-systemBackground min-h-screen">
        <div className="container mx-auto max-w-screen-2xl px-4 py-6">
          <div className="bg-fill mb-6 h-12 w-32 animate-pulse rounded-lg" />
          <div className="grid gap-6">
            <div className="bg-fill h-64 animate-pulse rounded-xl" />
            <div className="bg-fill h-96 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-systemBackground min-h-screen">
        <div className="container mx-auto max-w-screen-2xl px-4 py-6">
          <Button variant="ghost" onClick={() => router.push('/')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div className="border-red bg-red/10 rounded-lg border p-8 text-center">
            <p className="text-red text-lg font-medium">加载失败</p>
            <p className="text-secondaryLabel mt-2 text-sm">{error?.message || '无法找到该活动'}</p>
          </div>
        </div>
      </div>
    )
  }

  const { activity, splits: activitySplits } = data
  const typeEmoji = activity.type === 'running' ? '🏃' : activity.type === 'cycling' ? '🚴' : '🚶'

  // Convert database splits to chart format
  const chartSplits = activitySplits.map((split: Split) => ({
    kilometer: split.kilometer,
    pace: split.pace,
    distance: split.distance,
    duration: split.duration,
  }))

  return (
    <div className="bg-systemBackground min-h-screen">
      <div className="container mx-auto max-w-screen-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-secondaryLabel hover:text-label mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-label text-3xl font-bold">
                {typeEmoji} {activity.title || '跑步活动'}
              </h1>
              <p className="text-secondaryLabel mt-2">
                {formatDate(activity.startTime)} {formatTime(activity.startTime)}
              </p>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-2">
              <Button onClick={handlePlayPause} className="bg-blue hover:bg-blue/90 text-white">
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    暂停回放
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    播放回放
                  </>
                )}
              </Button>
              {animationProgress > 0 && (
                <Button
                  variant="outline"
                  onClick={handleStopPlayback}
                  className="border-separator text-secondaryLabel hover:bg-fill"
                >
                  停止
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <section className="mb-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="距离" value={(activity.distance / 1000).toFixed(2)} unit="km" />
            <StatsCard title="时长" value={formatDuration(activity.duration)} unit="" />
            {activity.averagePace && <StatsCard title="平均配速" value={formatPace(activity.averagePace)} unit="/km" />}
            {activity.elevationGain !== null && activity.elevationGain > 0 && (
              <StatsCard title="爬升" value={activity.elevationGain.toFixed(0)} unit="m" />
            )}
          </div>
        </section>

        {/* Map Section */}
        <section className="mb-8">
          <h2 className="text-label mb-4 text-2xl font-bold">路线地图</h2>
          <div className="border-separator relative h-[500px] overflow-hidden rounded-xl border">
            <RunMap className="h-full w-full">
              {/* Static pace route or animated playback */}
              {isPlaying ? (
                <AnimatedRoute
                  segments={paceSegments}
                  activityId={activityId}
                  isPlaying={isPlaying}
                  onProgressChange={setAnimationProgress}
                  onAnimationComplete={handleAnimationComplete}
                  speed={1.5}
                />
              ) : (
                <>
                  <PaceRouteLayer segments={paceSegments} activityId={activityId} />
                  <KilometerMarkers markers={kmMarkers} />
                </>
              )}
            </RunMap>

            {/* Floating info card during playback */}
            {isPlaying && currentPoint && (
              <FloatingInfoCard
                currentPoint={currentPoint}
                averagePace={activity.averagePace || 360}
                isPlaying={isPlaying}
                progress={animationProgress}
                onPlayPause={handlePlayPause}
              />
            )}
          </div>
        </section>

        {/* Pace Analysis Section */}
        {chartSplits.length > 0 && (
          <section className="mb-8">
            <h2 className="text-label mb-4 text-2xl font-bold">配速分析</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Pace Chart */}
              <div className="border-separator bg-secondarySystemBackground rounded-xl border p-6">
                <h3 className="text-label mb-4 text-lg font-semibold">每公里配速</h3>
                <PaceChart splits={chartSplits} averagePace={activity.averagePace || 360} />
              </div>

              {/* Splits Table */}
              <div className="border-separator bg-secondarySystemBackground rounded-xl border p-6">
                <h3 className="text-label mb-4 text-lg font-semibold">分段数据</h3>
                <SplitsTable splits={chartSplits} />
              </div>
            </div>
          </section>
        )}

        {/* Additional Stats (if available) */}
        {(activity.averageHeartRate || activity.calories) && (
          <section className="mb-8">
            <h2 className="text-label mb-4 text-2xl font-bold">其他数据</h2>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {activity.averageHeartRate && (
                <StatsCard title="平均心率" value={activity.averageHeartRate.toString()} unit="bpm" />
              )}
              {activity.maxHeartRate && (
                <StatsCard title="最大心率" value={activity.maxHeartRate.toString()} unit="bpm" />
              )}
              {activity.calories && <StatsCard title="卡路里" value={activity.calories.toString()} unit="kcal" />}
              {activity.bestPace && <StatsCard title="最佳配速" value={formatPace(activity.bestPace)} unit="/km" />}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
