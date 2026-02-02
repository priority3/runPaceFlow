'use client'

import { motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'

import type { SocialPreset } from '@/lib/art/export'
import type { FingerprintSplit } from '@/lib/art/fingerprint'
import { fingerprintSettingsAtom, globalArtSettingsAtom } from '@/stores/art'

import { ArtExportButton } from '../shared/ArtExportButton'
import { useCanvasExport } from '../shared/useCanvasExport'
import { FingerprintCanvas } from './FingerprintCanvas'
import { FingerprintControls } from './FingerprintControls'

interface RunningFingerprintProps {
  splits: Array<{
    kilometer: number
    pace: number
    duration: number
    averageHeartRate?: number
  }>
  averagePace: number
  maxHeartRate?: number
  elevationData?: number[]
  activityTitle?: string
}

/**
 * Running Fingerprint visualization component
 * Generates unique circular patterns from running data
 */
export function RunningFingerprint({
  splits,
  averagePace,
  maxHeartRate,
  elevationData = [],
  activityTitle = '跑步指纹',
}: RunningFingerprintProps) {
  const settings = useAtomValue(fingerprintSettingsAtom)
  const globalSettings = useAtomValue(globalArtSettingsAtom)
  const { setCanvas, downloadForSocial, copyToClipboard, share } = useCanvasExport()

  // Convert splits to fingerprint format
  const fingerprintSplits: FingerprintSplit[] = useMemo(() => {
    return splits.map((split, index) => ({
      kilometer: split.kilometer,
      pace: split.pace,
      duration: split.duration,
      averageHeartRate: split.averageHeartRate,
      elevation: elevationData[index],
    }))
  }, [splits, elevationData])

  // Check data availability
  const hasHeartRateData = splits.some((s) => s.averageHeartRate !== undefined)
  const hasElevationData = elevationData.length > 0

  // Export handlers
  const handleDownload = async (preset: SocialPreset) => {
    await downloadForSocial(preset, activityTitle.replaceAll(/\s+/g, '_'))
  }

  const handleCopy = async () => {
    await copyToClipboard()
  }

  const handleShare = async () => {
    await share(activityTitle, `我的跑步指纹 - ${splits.length}公里`)
  }

  if (splits.length === 0) {
    return (
      <div className="text-label/50 flex h-64 items-center justify-center rounded-2xl border border-white/20 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
        暂无分段数据，无法生成指纹
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Canvas container - max width on larger screens for better proportions */}
      <div className="relative mx-auto aspect-square w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-black shadow-lg dark:border-white/10">
        <FingerprintCanvas
          splits={fingerprintSplits}
          mode={settings.mode}
          averagePace={averagePace}
          maxHeartRate={maxHeartRate}
          elevationData={elevationData}
          rotation={(settings.rotation * Math.PI) / 180}
          scale={settings.scale}
          showRadialLines={settings.showRadialLines}
          animateRotation={settings.animateRotation}
          theme={globalSettings.theme}
          onCanvasReady={setCanvas}
        />

        {/* Overlay info */}
        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between sm:right-4 sm:bottom-4 sm:left-4">
          <div className="text-xs text-white/60 sm:text-sm">
            <span className="font-medium text-white">{splits.length}</span> 公里
          </div>
          <div className="text-[10px] text-white/40 sm:text-xs">RunPaceFlow</div>
        </div>
      </div>

      {/* Controls */}
      <FingerprintControls
        hasHeartRateData={hasHeartRateData}
        hasElevationData={hasElevationData}
      />

      {/* Export buttons */}
      <div className="flex justify-end">
        <ArtExportButton onDownload={handleDownload} onCopy={handleCopy} onShare={handleShare} />
      </div>
    </motion.div>
  )
}
