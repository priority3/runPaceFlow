/**
 * Activity Detail Page
 *
 * Glassmorphic design with seamless depth transitions
 */

'use client'

import { motion } from 'framer-motion'
import { useAtom } from 'jotai'
import { ArrowLeft, Pause, Play, Square } from 'lucide-react'
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
      <div className="bg-system-background min-h-screen">
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gray-100/50 via-transparent to-gray-200/30 dark:from-gray-900/50 dark:to-gray-800/30" />
        <div className="relative container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 h-10 w-24 animate-pulse rounded-xl bg-white/40 backdrop-blur-xl dark:bg-black/20" />
          <div className="mb-8 h-32 animate-pulse rounded-2xl bg-white/40 backdrop-blur-xl dark:bg-black/20" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-white/40 backdrop-blur-xl dark:bg-black/20"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-system-background min-h-screen">
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gray-100/50 via-transparent to-gray-200/30 dark:from-gray-900/50 dark:to-gray-800/30" />
        <div className="relative container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/')}
            className="text-label/60 hover:text-label mb-6 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>
          <motion.div
            className="flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/50 py-16 backdrop-blur-xl dark:border-white/10 dark:bg-black/20"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-label text-lg font-medium">加载失败</p>
            <p className="text-label/50 mt-2 text-center text-sm">
              {error?.message || '无法找到该活动'}
            </p>
          </motion.div>
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
    <div className="bg-system-background min-h-screen">
      {/* Subtle gradient overlay for glassmorphic depth */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gray-100/50 via-transparent to-gray-200/30 dark:from-gray-900/50 dark:to-gray-800/30" />

      <div className="relative container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => router.push('/')}
            className="text-label/60 hover:text-label mb-6 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-label text-2xl font-semibold sm:text-3xl">
                {typeEmoji} {activity.title || '跑步活动'}
              </h1>
              <p className="text-label/50 mt-2 text-sm">
                {formatDate(activity.startTime)} {formatTime(activity.startTime)}
              </p>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handlePlayPause}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/60 px-4 py-2.5 text-sm font-medium backdrop-blur-xl transition-all hover:bg-white/80 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/40"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span className="hidden sm:inline">暂停</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">回放</span>
                  </>
                )}
              </motion.button>
              {animationProgress > 0 && (
                <motion.button
                  onClick={handleStopPlayback}
                  className="text-label/60 hover:text-label flex items-center gap-2 rounded-xl border border-white/20 bg-white/40 px-3 py-2.5 text-sm backdrop-blur-xl transition-all hover:bg-white/60 dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Square className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.section
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="距离" value={(activity.distance / 1000).toFixed(2)} unit="km" />
            <StatsCard title="时长" value={formatDuration(activity.duration)} unit="" />
            {activity.averagePace && (
              <StatsCard title="平均配速" value={formatPace(activity.averagePace)} unit="/km" />
            )}
            {activity.elevationGain !== null && activity.elevationGain > 0 && (
              <StatsCard title="爬升" value={activity.elevationGain.toFixed(0)} unit="m" />
            )}
          </div>
        </motion.section>

        {/* Map Section */}
        <motion.section
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-label text-lg font-semibold">路线地图</h2>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gray-100 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="h-[400px] sm:h-[500px]">
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
          </div>
        </motion.section>

        {/* Pace Analysis Section */}
        {chartSplits.length > 0 && (
          <motion.section
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="mb-4">
              <h2 className="text-label text-lg font-semibold">配速分析</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Pace Chart */}
              <div className="rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
                <h3 className="text-label/80 mb-4 text-sm font-medium">每公里配速</h3>
                <PaceChart splits={chartSplits} averagePace={activity.averagePace || 360} />
              </div>

              {/* Splits Table */}
              <div className="rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
                <h3 className="text-label/80 mb-4 text-sm font-medium">分段数据</h3>
                <SplitsTable splits={chartSplits} />
              </div>
            </div>
          </motion.section>
        )}

        {/* Additional Stats (if available) */}
        {(activity.averageHeartRate || activity.calories) && (
          <motion.section
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="mb-4">
              <h2 className="text-label text-lg font-semibold">其他数据</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {activity.averageHeartRate && (
                <StatsCard
                  title="平均心率"
                  value={activity.averageHeartRate.toString()}
                  unit="bpm"
                />
              )}
              {activity.maxHeartRate && (
                <StatsCard title="最大心率" value={activity.maxHeartRate.toString()} unit="bpm" />
              )}
              {activity.calories && (
                <StatsCard title="卡路里" value={activity.calories.toString()} unit="kcal" />
              )}
              {activity.bestPace && (
                <StatsCard title="最佳配速" value={formatPace(activity.bestPace)} unit="/km" />
              )}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
