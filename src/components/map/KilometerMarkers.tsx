/**
 * KilometerMarkers — map km pins with shared selection highlight.
 */

'use client'

import { useAtom } from 'jotai'
import { Marker, Popup } from 'react-map-gl/maplibre'

import type { KilometerMarker } from '@/lib/map/pace-utils'
import { formatPace, paceToSpeed } from '@/lib/pace/calculator'
import { cn } from '@/lib/utils'
import { selectedKilometerAtom } from '@/stores/map'

type MetricMode = 'pace' | 'speed'

export interface KilometerMarkersProps {
  markers: KilometerMarker[]
  metric?: MetricMode
  /** When true, selecting a marker also notifies parent via onSelect. */
  onSelect?: (kilometer: number) => void
}

export function KilometerMarkers({ markers, metric = 'pace', onSelect }: KilometerMarkersProps) {
  const [selectedKm, setSelectedKm] = useAtom(selectedKilometerAtom)
  const isSpeedMode = metric === 'speed'
  const selectedMarker = markers.find((marker) => marker.kilometer === selectedKm) ?? null

  if (!markers || markers.length === 0) {
    return null
  }

  return (
    <>
      {markers.map((marker) => {
        const selected = selectedKm === marker.kilometer
        return (
          <Marker
            key={`km-${marker.kilometer}`}
            longitude={marker.coordinate.longitude}
            latitude={marker.coordinate.latitude}
            anchor="center"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const next = selected ? null : marker.kilometer
                setSelectedKm(next)
                if (next !== null) onSelect?.(next)
              }}
              className={cn(
                'flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[10px] leading-none font-medium transition-transform hover:scale-110',
                selected
                  ? 'bg-accent text-accent-content ring-accent/30 scale-110 shadow-[0_2px_10px_rgba(36,35,31,0.2)] ring-4'
                  : 'bg-label/90 text-system-background shadow-[0_2px_8px_rgba(36,35,31,0.16)] ring-2 ring-white/90 dark:ring-black/30',
              )}
            >
              {marker.kilometer}
            </button>
          </Marker>
        )
      })}

      {selectedMarker && (
        <Popup
          longitude={selectedMarker.coordinate.longitude}
          latitude={selectedMarker.coordinate.latitude}
          anchor="bottom"
          onClose={() => setSelectedKm(null)}
          closeButton={true}
          closeOnClick={false}
          className="map-popup"
        >
          <div className="p-2">
            <div className="text-label mb-1 text-sm font-medium">
              第 {selectedMarker.kilometer} 公里
            </div>
            <div className="text-secondary-label text-xs">
              {isSpeedMode
                ? `速度: ${paceToSpeed(selectedMarker.pace).toFixed(1)} km/h`
                : `配速: ${formatPace(selectedMarker.pace)}/km`}
            </div>
            <div className="text-tertiary-label text-xs">
              累计: {(selectedMarker.distance / 1000).toFixed(2)} km
            </div>
          </div>
        </Popup>
      )}
    </>
  )
}
