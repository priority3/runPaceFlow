/**
 * KilometerMarkers Component
 *
 * Displays kilometer markers on the map with pace information
 */

'use client'

import { useState } from 'react'
import { Marker, Popup } from 'react-map-gl/maplibre'

import type { KilometerMarker } from '@/lib/map/pace-utils'
import { formatPace } from '@/lib/pace/calculator'

export interface KilometerMarkersProps {
  markers: KilometerMarker[]
}

/**
 * 渲染每公里标记点
 * 点击标记点显示配速信息
 */
export function KilometerMarkers({ markers }: KilometerMarkersProps) {
  const [selectedMarker, setSelectedMarker] = useState<KilometerMarker | null>(null)

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
            className="bg-blue flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg transition-transform hover:scale-110"
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
            <div className="text-secondaryLabel text-xs">
              配速: {formatPace(selectedMarker.pace)}
            </div>
            <div className="text-tertiaryLabel text-xs">
              累计: {(selectedMarker.distance / 1000).toFixed(2)} km
            </div>
          </div>
        </Popup>
      )}
    </>
  )
}
