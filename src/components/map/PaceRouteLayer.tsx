/**
 * PaceRouteLayer Component
 *
 * Displays running routes with pace-based gradient colors
 */

'use client'

import { Layer, Source } from 'react-map-gl/maplibre'
import type { PaceSegment } from '@/lib/map/pace-utils'

export interface PaceRouteLayerProps {
  segments: PaceSegment[]
  activityId: string
}

/**
 * 渲染配速渐变色路线
 * 每个分段使用不同颜色表示不同的配速
 */
export function PaceRouteLayer({ segments, activityId }: PaceRouteLayerProps) {
  if (!segments || segments.length === 0) {
    return null
  }

  return (
    <>
      {segments.map((segment, index) => {
        const geojson = {
          type: 'Feature' as const,
          properties: {
            pace: segment.pace,
            distance: segment.distance,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: segment.coordinates,
          },
        }

        return (
          <Source
            key={`${activityId}-segment-${index}`}
            id={`pace-segment-${activityId}-${index}`}
            type="geojson"
            data={geojson}
          >
            <Layer
              id={`pace-line-${activityId}-${index}`}
              type="line"
              paint={{
                'line-color': segment.color,
                'line-width': 4,
                'line-opacity': 0.9,
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
            />
          </Source>
        )
      })}
    </>
  )
}
