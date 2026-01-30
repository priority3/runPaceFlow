'use client'

import { motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'

import type { SocialPreset } from '@/lib/art/export'
import type { KilometerMarker } from '@/lib/map/pace-utils'
import { constellationSettingsAtom, globalArtSettingsAtom } from '@/stores/art'

import { ArtExportButton } from '../shared/ArtExportButton'
import { useCanvasExport } from '../shared/useCanvasExport'
import { ConstellationCanvas } from './ConstellationCanvas'
import { ConstellationControls } from './ConstellationControls'

interface RouteConstellationProps {
  kmMarkers: KilometerMarker[]
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
 * Route Constellation visualization component
 * Transforms running routes into star constellation patterns
 */
export function RouteConstellation({
  kmMarkers,
  averagePace,
  bounds,
  activityTitle = '路线星座',
}: RouteConstellationProps) {
  const settings = useAtomValue(constellationSettingsAtom)
  const globalSettings = useAtomValue(globalArtSettingsAtom)
  const { setCanvas, downloadForSocial, copyToClipboard, share } = useCanvasExport()

  // Convert km markers to constellation format
  const markers = useMemo(() => {
    return kmMarkers.map((marker) => ({
      coordinate: marker.coordinate,
      kilometer: marker.kilometer,
      pace: marker.pace,
    }))
  }, [kmMarkers])

  // Export handlers
  const handleDownload = async (preset: SocialPreset) => {
    await downloadForSocial(preset, activityTitle.replaceAll(/\s+/g, '_'))
  }

  const handleCopy = async () => {
    await copyToClipboard()
  }

  const handleShare = async () => {
    await share(activityTitle, `我的跑步星座 - ${kmMarkers.length}公里`)
  }

  if (kmMarkers.length === 0 || !bounds) {
    return (
      <div className="text-label/50 flex h-64 items-center justify-center rounded-2xl border border-white/20 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
        暂无公里标记数据，无法生成星座图
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
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/20 bg-black shadow-lg dark:border-white/10">
        <ConstellationCanvas
          markers={markers}
          bounds={bounds}
          averagePace={averagePace}
          showLabels={settings.showLabels}
          showConnections={settings.showConnections}
          starSize={settings.starSize}
          twinkle={settings.twinkle}
          theme={globalSettings.theme}
          onCanvasReady={setCanvas}
        />

        {/* Overlay info */}
        <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between">
          <div className="text-sm text-white/60">
            <span className="font-medium text-white">{kmMarkers.length}</span> 颗星
          </div>
          <div className="text-xs text-white/40">RunPaceFlow</div>
        </div>
      </div>

      {/* Controls */}
      <ConstellationControls />

      {/* Export buttons */}
      <div className="flex justify-end">
        <ArtExportButton onDownload={handleDownload} onCopy={handleCopy} onShare={handleShare} />
      </div>
    </motion.div>
  )
}
