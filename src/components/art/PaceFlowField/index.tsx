'use client'

import { motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'

import type { SocialPreset } from '@/lib/art/export'
import type { PaceSegment } from '@/lib/map/pace-utils'
import { flowFieldSettingsAtom, globalArtSettingsAtom } from '@/stores/art'

import { ArtExportButton } from '../shared/ArtExportButton'
import { useCanvasExport } from '../shared/useCanvasExport'
import { FlowFieldCanvas } from './FlowFieldCanvas'
import { FlowFieldControls } from './FlowFieldControls'

interface PaceFlowFieldProps {
  paceSegments: PaceSegment[]
  averagePace: number
  bounds: {
    minLng: number
    maxLng: number
    minLat: number
    maxLat: number
  } | null
  activityTitle?: string
}

/**
 * Pace Flow Field visualization component
 * Creates flowing particle animation along running routes
 */
export function PaceFlowField({
  paceSegments,
  averagePace,
  bounds,
  activityTitle = '配速流场',
}: PaceFlowFieldProps) {
  const settings = useAtomValue(flowFieldSettingsAtom)
  const globalSettings = useAtomValue(globalArtSettingsAtom)
  const { setCanvas, downloadForSocial, copyToClipboard, share } = useCanvasExport()

  // Extract coordinates and paces from segments
  const { coordinates, paces } = useMemo(() => {
    const coords: Array<[number, number]> = []
    const paceValues: number[] = []

    for (const segment of paceSegments) {
      for (const coord of segment.coordinates) {
        coords.push(coord)
        paceValues.push(segment.pace)
      }
    }

    return { coordinates: coords, paces: paceValues }
  }, [paceSegments])

  // Export handlers
  const handleDownload = async (preset: SocialPreset) => {
    await downloadForSocial(preset, activityTitle.replaceAll(/\s+/g, '_'))
  }

  const handleCopy = async () => {
    await copyToClipboard()
  }

  const handleShare = async () => {
    await share(activityTitle, '我的跑步配速流场')
  }

  if (paceSegments.length === 0 || !bounds) {
    return (
      <div className="text-label/50 flex h-64 items-center justify-center rounded-2xl border border-white/20 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
        暂无路线数据，无法生成流场
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Canvas container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/20 bg-black shadow-lg dark:border-white/10">
        <FlowFieldCanvas
          coordinates={coordinates}
          paces={paces}
          bounds={bounds}
          averagePace={averagePace}
          isPlaying={settings.isPlaying}
          speed={settings.speed}
          particleCount={settings.particleCount}
          trailLength={settings.trailLength}
          colorByPace={settings.colorByPace}
          theme={globalSettings.theme}
          onCanvasReady={setCanvas}
        />

        {/* Overlay info */}
        <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between">
          <div className="text-sm text-white/60">
            {settings.isPlaying ? (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                播放中
              </span>
            ) : (
              '已暂停'
            )}
          </div>
          <div className="text-xs text-white/40">RunPaceFlow</div>
        </div>
      </div>

      {/* Controls */}
      <FlowFieldControls />

      {/* Export buttons */}
      <div className="flex justify-end">
        <ArtExportButton onDownload={handleDownload} onCopy={handleCopy} onShare={handleShare} />
      </div>
    </motion.div>
  )
}
