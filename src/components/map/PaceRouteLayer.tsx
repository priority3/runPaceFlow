/**
 * PaceRouteLayer Component
 *
 * Displays running routes with pace-based gradient colors
 * Optimized: Uses a single layer with line-gradient for better performance
 */

'use client'

import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'

import type { PaceSegment } from '@/lib/map/pace-utils'

export interface PaceRouteLayerProps {
  segments: PaceSegment[]
  activityId: string
}

/**
 * 渲染配速渐变色路线
 * 优化版：将所有分段合并为一条线，使用 line-gradient 实现颜色渐变
 */
export function PaceRouteLayer({ segments, activityId }: PaceRouteLayerProps) {
  // Combine all segments into a single LineString with gradient stops
  const { geojson, gradientStops } = useMemo(() => {
    if (!segments || segments.length === 0) {
      return { geojson: null, gradientStops: null }
    }

    // Collect all coordinates and calculate total distance
    const allCoordinates: [number, number][] = []
    let totalDistance = 0

    // First pass: collect all coordinates and find total distance
    segments.forEach((segment, idx) => {
      segment.coordinates.forEach((coord, coordIdx) => {
        // Avoid duplicate points at segment boundaries
        if (idx === 0 || coordIdx > 0) {
          allCoordinates.push(coord)
        }
      })
      // Estimate segment length from coordinates
      if (segment.coordinates.length >= 2) {
        const segmentDist = estimateSegmentDistance(segment.coordinates)
        totalDistance += segmentDist
      }
    })

    if (allCoordinates.length < 2) {
      return { geojson: null, gradientStops: null }
    }

    // Create GeoJSON LineString
    const lineGeojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: allCoordinates,
      },
    }

    // Create gradient stops based on segment colors
    // Format: [offset, color, offset, color, ...]
    const stops: (number | string)[] = []
    let currentDistance = 0

    segments.forEach((segment) => {
      const segmentDist = estimateSegmentDistance(segment.coordinates)
      const startOffset = totalDistance > 0 ? currentDistance / totalDistance : 0
      const endOffset = totalDistance > 0 ? (currentDistance + segmentDist) / totalDistance : 1

      // Add start and end stops for this segment
      if (stops.length === 0) {
        stops.push(startOffset, segment.color)
      }
      stops.push(endOffset, segment.color)

      currentDistance += segmentDist
    })

    return { geojson: lineGeojson, gradientStops: stops }
  }, [segments])

  if (!geojson || !gradientStops || gradientStops.length < 2) {
    return null
  }

  return (
    <Source id={`pace-route-${activityId}`} type="geojson" data={geojson} lineMetrics={true}>
      <Layer
        id={`pace-line-${activityId}`}
        type="line"
        paint={{
          'line-color': segments[0]?.color || '#374151',
          'line-width': 4,
          'line-opacity': 0.9,
          'line-gradient': ['interpolate', ['linear'], ['line-progress'], ...gradientStops],
        }}
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
      />
    </Source>
  )
}

/**
 * Estimate distance of a segment from its coordinates using Haversine formula
 */
function estimateSegmentDistance(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0

  let distance = 0
  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1] = coordinates[i - 1]
    const [lon2, lat2] = coordinates[i]
    distance += haversineDistance(lat1, lon1, lat2, lon2)
  }
  return distance
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
