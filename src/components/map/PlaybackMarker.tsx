/**
 * PlaybackMarker Component
 *
 * Shows start/end points and a pulsing "current" marker during route playback.
 */

'use client'

import { Marker } from 'react-map-gl/maplibre'

import type { TrackPoint } from '@/lib/map/pace-utils'
import { useTheme } from '@/lib/theme'
import { getSportColors } from '@/lib/theme/palette'

export interface PlaybackMarkerProps {
  current?: TrackPoint
  start?: TrackPoint
  end?: TrackPoint
  accentColor?: string
}

export function PlaybackMarker({ current, start, end, accentColor }: PlaybackMarkerProps) {
  const { resolvedTheme } = useTheme()
  if (!current && !start && !end) return null
  const markerColor = accentColor ?? getSportColors(resolvedTheme).running

  return (
    <>
      {start && (
        <Marker longitude={start.longitude} latitude={start.latitude} anchor="center">
          <div className="pointer-events-none grid place-items-center">
            <div className="h-3 w-3 rounded-full bg-[var(--pr-text)] ring-2 ring-white/90" />
          </div>
        </Marker>
      )}

      {end && (
        <Marker longitude={end.longitude} latitude={end.latitude} anchor="center">
          <div className="pointer-events-none grid place-items-center">
            <div className="h-3 w-3 rounded-full bg-[var(--pr-text-2)] ring-2 ring-white/90" />
          </div>
        </Marker>
      )}

      {current && (
        <Marker longitude={current.longitude} latitude={current.latitude} anchor="center">
          {/* 播放头只留一个实心点 + 极轻呼吸，不做发光与扩散圈 */}
          <div className="pointer-events-none relative">
            <div
              className="pr-breathe h-3.5 w-3.5 rounded-full ring-2 ring-white/90"
              style={{ backgroundColor: markerColor }}
            />
          </div>
        </Marker>
      )}
    </>
  )
}
