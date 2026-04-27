/**
 * KilometerMarkers Component
 *
 * Displays kilometer markers on the map with pace information
 */

'use client'

import { useState } from 'react'
import { Marker, Popup } from 'react-map-gl/maplibre'

import type { KilometerMarker } from '@/lib/map/pace-utils'
import { formatPace, paceToSpeed } from '@/lib/pace/calculator'

type MetricMode = 'pace' | 'speed'

export interface KilometerMarkersProps {
  markers: KilometerMarker[]
  metric?: MetricMode
}

/**
 * 渲染每公里标记点
 * 点击标记点显示配速信息
 */
export function KilometerMarkers({ markers, metric = 'pace' }: KilometerMarkersProps) {
  const [selectedMarker, setSelectedMarker] = useState<KilometerMarker | null>(null)
  const isSpeedMode = metric === 'speed'

  if (!markers || markers.length === 0) {
    return null
  }

  return (
    <>
      {/* 渲染所有标记点 */}
      {markers.map((marker) => (
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
              setSelectedMarker(marker)
            }}
            className="bg-blue flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white text-[11px] leading-none font-semibold text-white shadow-md transition-transform hover:scale-110"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
          >
            {marker.kilometer}
          </button>
        </Marker>
      ))}

      {/* Popup 显示配速信息 */}
      {selectedMarker && (
        <Popup
          longitude={selectedMarker.coordinate.longitude}
          latitude={selectedMarker.coordinate.latitude}
          anchor="bottom"
          onClose={() => setSelectedMarker(null)}
          closeButton={true}
          closeOnClick={false}
          className="map-popup"
        >
          <div className="p-2">
            <div className="text-label mb-1 text-sm font-bold">
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
