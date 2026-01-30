'use client'

import { motion } from 'framer-motion'
import { useAtom } from 'jotai'
import { Fingerprint, Sparkles, Stars } from 'lucide-react'

import type { KilometerMarker, PaceSegment } from '@/lib/map/pace-utils'
import type { ArtType } from '@/stores/art'
import { selectedArtTypeAtom } from '@/stores/art'

import { PaceFlowField } from './PaceFlowField'
import { RouteConstellation } from './RouteConstellation'
import { RunningFingerprint } from './RunningFingerprint'

interface ArtGalleryProps {
  splits: Array<{
    kilometer: number
    pace: number
    duration: number
    distance: number
  }>
  trackPoints: Array<{
    longitude: number
    latitude: number
    time: Date
    distance: number
    elevation?: number
  }>
  paceSegments: PaceSegment[]
  kmMarkers: KilometerMarker[]
  heartRateData: Array<{ distance: number; heartRate: number }>
  activity: {
    averagePace?: number | null
    maxHeartRate?: number | null
    title?: string | null
  }
}

const artTypes: Array<{
  value: ArtType
  label: string
  icon: typeof Fingerprint
  description: string
}> = [
  {
    value: 'fingerprint',
    label: '跑步指纹',
    icon: Fingerprint,
    description: '将每公里转化为独特的圆环图案',
  },
  {
    value: 'flowfield',
    label: '配速流场',
    icon: Sparkles,
    description: '粒子沿路线流动的动态效果',
  },
  {
    value: 'constellation',
    label: '路线星座',
    icon: Stars,
    description: '将路线转化为星座图案',
  },
]

/**
 * Art Gallery component that displays all art visualization options
 */
export function ArtGallery({
  splits,
  trackPoints,
  paceSegments,
  kmMarkers,
  heartRateData,
  activity,
}: ArtGalleryProps) {
  const [selectedType, setSelectedType] = useAtom(selectedArtTypeAtom)

  const averagePace = activity.averagePace || 360
  const maxHeartRate = activity.maxHeartRate || 190
  const activityTitle = activity.title || '跑步活动'

  // Calculate bounds from track points
  const bounds =
    trackPoints.length > 0
      ? {
          minLng: Math.min(...trackPoints.map((p) => p.longitude)),
          maxLng: Math.max(...trackPoints.map((p) => p.longitude)),
          minLat: Math.min(...trackPoints.map((p) => p.latitude)),
          maxLat: Math.max(...trackPoints.map((p) => p.latitude)),
        }
      : null

  // Extract elevation data
  const elevationData = trackPoints
    .filter((p) => p.elevation !== undefined)
    .map((p) => p.elevation as number)

  // Convert splits to include heart rate data
  const splitsWithHeartRate = splits.map((split) => {
    // Find average heart rate for this kilometer
    const kmStart = (split.kilometer - 1) * 1000
    const kmEnd = split.kilometer * 1000
    const hrPoints = heartRateData.filter((hr) => hr.distance >= kmStart && hr.distance < kmEnd)
    const avgHr =
      hrPoints.length > 0
        ? Math.round(hrPoints.reduce((sum, hr) => sum + hr.heartRate, 0) / hrPoints.length)
        : undefined

    return {
      ...split,
      averageHeartRate: avgHr,
    }
  })

  // Check if we have enough data for each visualization
  const hasRouteData = trackPoints.length > 0 && bounds !== null
  const hasSplitData = splits.length > 0

  return (
    <div className="space-y-6">
      {/* Art type selector */}
      <div className="grid gap-3 sm:grid-cols-3">
        {artTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.value
          const isDisabled =
            (type.value === 'flowfield' && !hasRouteData) ||
            (type.value === 'constellation' && !hasRouteData) ||
            (type.value === 'fingerprint' && !hasSplitData)

          return (
            <motion.button
              key={type.value}
              onClick={() => !isDisabled && setSelectedType(type.value)}
              disabled={isDisabled}
              className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                isSelected
                  ? 'border-blue bg-blue/10 text-blue'
                  : isDisabled
                    ? 'text-label/30 cursor-not-allowed border-white/10 bg-white/20 dark:bg-black/10'
                    : 'text-label hover:border-blue/50 border-white/20 bg-white/50 hover:bg-white/70 dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/30'
              }`}
              whileTap={!isDisabled ? { scale: 0.98 } : undefined}
            >
              <Icon className={`h-6 w-6 ${isSelected ? 'text-blue' : ''}`} />
              <span className="font-medium">{type.label}</span>
              <span className={`text-xs ${isSelected ? 'text-blue/70' : 'text-label/50'}`}>
                {type.description}
              </span>
              {isDisabled && (
                <span className="text-label/40 absolute -bottom-1 text-xs">数据不足</span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Selected visualization */}
      <motion.div
        key={selectedType}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {selectedType === 'fingerprint' && hasSplitData && (
          <RunningFingerprint
            splits={splitsWithHeartRate}
            averagePace={averagePace}
            maxHeartRate={maxHeartRate}
            elevationData={elevationData}
            activityTitle={activityTitle}
          />
        )}

        {selectedType === 'flowfield' && hasRouteData && (
          <PaceFlowField
            paceSegments={paceSegments}
            averagePace={averagePace}
            bounds={bounds}
            activityTitle={activityTitle}
          />
        )}

        {selectedType === 'constellation' && hasRouteData && (
          <RouteConstellation
            kmMarkers={kmMarkers}
            averagePace={averagePace}
            bounds={bounds}
            activityTitle={activityTitle}
          />
        )}

        {/* Fallback message */}
        {((selectedType === 'fingerprint' && !hasSplitData) ||
          (selectedType === 'flowfield' && !hasRouteData) ||
          (selectedType === 'constellation' && !hasRouteData)) && (
          <div className="text-label/50 flex h-64 items-center justify-center rounded-2xl border border-white/20 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
            数据不足，无法生成此类型的艺术图
          </div>
        )}
      </motion.div>
    </div>
  )
}
