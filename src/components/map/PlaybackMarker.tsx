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
            <div className="bg-green h-3 w-3 rounded-full shadow-[0_6px_18px_rgba(0,0,0,0.25)] ring-2 ring-white/90" />
          </div>
        </Marker>
      )}

      {end && (
        <Marker longitude={end.longitude} latitude={end.latitude} anchor="center">
          <div className="pointer-events-none grid place-items-center">
            <div className="bg-red h-3 w-3 rounded-full shadow-[0_6px_18px_rgba(0,0,0,0.25)] ring-2 ring-white/90" />
          </div>
        </Marker>
      )}

      {current && (
        <Marker longitude={current.longitude} latitude={current.latitude} anchor="center">
          <div className="pointer-events-none relative">
            <div
              className="absolute -inset-3 rounded-full opacity-30 blur-[0.5px]"
              style={{ backgroundColor: markerColor }}
            />
            <div className="absolute -inset-2 animate-ping rounded-full opacity-30 [animation-duration:1.4s] [animation-timing-function:ease-in-out]">
              <div
                className="h-full w-full rounded-full"
                style={{ backgroundColor: markerColor }}
              />
            </div>
            <div
              className="h-3.5 w-3.5 rounded-full shadow-[0_10px_28px_rgba(0,0,0,0.35)] ring-2 ring-white/90"
              style={{ backgroundColor: markerColor }}
            />
          </div>
        </Marker>
      )}
    </>
  )
}
