/**
 * 地图配速工具函数
 * 处理配速路线分段和颜色映射
 */

import { getPaceColor } from '@/lib/pace/calculator'
import type { Coordinate, PacePoint } from '@/types/map'

/**
 * GPS 轨迹点（带时间和距离）
 */
export interface TrackPoint extends Coordinate {
  time: Date
  distance: number // 累计距离（米）
}

/**
 * 配速路线段
 */
export interface PaceSegment {
  coordinates: [number, number][] // [lng, lat]
  pace: number // 该段的配速（秒/公里）
  color: string // 该段的颜色
  distance: number // 该段的起始距离（米）
}

/**
 * 公里标记点
 */
export interface KilometerMarker {
  coordinate: { longitude: number; latitude: number }
  kilometer: number // 第几公里
  pace: number // 该公里的配速
  distance: number // 累计距离（米）
}

/**
 * 将 GPS 轨迹分段并根据配速着色
 * @param trackPoints GPS 轨迹点数组
 * @param averagePace 平均配速（秒/公里）
 * @param segmentLength 每段长度（米），默认 100 米
 * @returns 配速路线段数组
 */
export function createPaceSegments(
  trackPoints: TrackPoint[],
  averagePace: number,
  segmentLength = 100,
): PaceSegment[] {
  if (trackPoints.length < 2) return []

  const segments: PaceSegment[] = []
  let currentSegment: [number, number][] = []
  let segmentStartDistance = 0
  let segmentStartTime = trackPoints[0].time
  let lastPoint = trackPoints[0]

  currentSegment.push([lastPoint.longitude, lastPoint.latitude])

  for (let i = 1; i < trackPoints.length; i++) {
    const point = trackPoints[i]
    const segmentDistance = point.distance - segmentStartDistance

    currentSegment.push([point.longitude, point.latitude])

    // 如果该段距离超过阈值，创建一个新段
    if (segmentDistance >= segmentLength || i === trackPoints.length - 1) {
      // 计算该段的配速
      const duration = (point.time.getTime() - segmentStartTime.getTime()) / 1000
      const pace = duration > 0 ? (duration / segmentDistance) * 1000 : averagePace

      // 获取颜色
      const color = getPaceColor(pace, averagePace)

      segments.push({
        coordinates: [...currentSegment],
        pace,
        color,
        distance: segmentStartDistance,
      })

      // 重置当前段（保留最后一个点作为下一段的起点）
      currentSegment = [[point.longitude, point.latitude]]
      segmentStartDistance = point.distance
      segmentStartTime = point.time
    }

    lastPoint = point
  }

  return segments
}

/**
 * 从 GPS 轨迹生成公里标记点
 * @param trackPoints GPS 轨迹点数组
 * @returns 公里标记点数组
 */
export function createKilometerMarkers(trackPoints: TrackPoint[]): KilometerMarker[] {
  if (trackPoints.length === 0) return []

  const markers: KilometerMarker[] = []
  let lastKm = 0

  for (let i = 0; i < trackPoints.length; i++) {
    const point = trackPoints[i]
    const currentKm = Math.floor(point.distance / 1000)

    // 如果到达新的公里数
    if (currentKm > lastKm) {
      // 查找最接近整公里的点
      const targetDistance = currentKm * 1000
      let closestPoint = point
      let minDiff = Math.abs(point.distance - targetDistance)

      // 向前查找几个点，找到最接近的
      for (let j = Math.max(0, i - 5); j <= Math.min(trackPoints.length - 1, i + 5); j++) {
        const diff = Math.abs(trackPoints[j].distance - targetDistance)
        if (diff < minDiff) {
          minDiff = diff
          closestPoint = trackPoints[j]
        }
      }

      // 计算该公里的配速（从上一公里到这一公里）
      const prevKmDistance = lastKm * 1000
      const prevIndex = trackPoints.findIndex((p) => p.distance >= prevKmDistance)
      const prevPoint = prevIndex !== -1 ? trackPoints[prevIndex] : trackPoints[0]

      const duration = (closestPoint.time.getTime() - prevPoint.time.getTime()) / 1000
      const distance = closestPoint.distance - prevPoint.distance
      const pace = duration > 0 && distance > 0 ? (duration / distance) * 1000 : 0

      markers.push({
        coordinate: {
          longitude: closestPoint.longitude,
          latitude: closestPoint.latitude,
        },
        kilometer: currentKm,
        pace,
        distance: closestPoint.distance,
      })

      lastKm = currentKm
    }
  }

  return markers
}

/**
 * 从分段数据生成配速点数组（用于图表等）
 * @param segments 配速路线段
 * @returns 配速点数组
 */
export function segmentsToPacePoints(segments: PaceSegment[]): PacePoint[] {
  return segments.map((segment) => ({
    coordinate: {
      longitude: segment.coordinates[0][0],
      latitude: segment.coordinates[0][1],
    },
    pace: segment.pace,
    distance: segment.distance,
    color: segment.color,
  }))
}

/**
 * Parse GPX data and create pace segments
 * @param gpxData Raw GPX XML string
 * @param averagePace Average pace in seconds per kilometer
 * @returns Array of pace segments
 */
export function parsePaceSegments(gpxData: string, averagePace: number): PaceSegment[] {
  if (!gpxData || gpxData.trim() === '') return []

  try {
    // Parse trackpoints from GPX
    const trackPoints = parseGPXToTrackPoints(gpxData)
    if (trackPoints.length < 2) return []

    // Create pace segments
    return createPaceSegments(trackPoints, averagePace, 100)
  } catch (error) {
    console.error('Failed to parse pace segments:', error)
    return []
  }
}

/**
 * Parse GPX XML to TrackPoint array
 */
function parseGPXToTrackPoints(gpxData: string): TrackPoint[] {
  const trackPoints: TrackPoint[] = []

  // Match trkpt elements with lat, lon, time, and optionally extensions
  const trkptRegex =
    /<trkpt[^>]+lat=["']([^"']+)["'][^>]+lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/trkpt>/gi

  let match
  let lastPoint: TrackPoint | null = null
  let cumulativeDistance = 0

  while ((match = trkptRegex.exec(gpxData)) !== null) {
    const lat = Number.parseFloat(match[1])
    const lon = Number.parseFloat(match[2])
    const content = match[3]

    if (Number.isNaN(lat) || Number.isNaN(lon)) continue

    // Extract time
    const timeMatch = content.match(/<time>([^<]+)<\/time>/i)
    const time = timeMatch ? new Date(timeMatch[1]) : new Date()

    // Calculate distance from last point
    if (lastPoint) {
      cumulativeDistance += haversineDistance(lastPoint.latitude, lastPoint.longitude, lat, lon)
    }

    const point: TrackPoint = {
      latitude: lat,
      longitude: lon,
      time,
      distance: cumulativeDistance,
    }

    trackPoints.push(point)
    lastPoint = point
  }

  // Try alternative format if no points found
  if (trackPoints.length === 0) {
    const altRegex =
      /<trkpt[^>]+lon=["']([^"']+)["'][^>]+lat=["']([^"']+)["'][^>]*>([\s\S]*?)<\/trkpt>/gi

    while ((match = altRegex.exec(gpxData)) !== null) {
      const lon = Number.parseFloat(match[1])
      const lat = Number.parseFloat(match[2])
      const content = match[3]

      if (Number.isNaN(lat) || Number.isNaN(lon)) continue

      const timeMatch = content.match(/<time>([^<]+)<\/time>/i)
      const time = timeMatch ? new Date(timeMatch[1]) : new Date()

      if (lastPoint) {
        cumulativeDistance += haversineDistance(lastPoint.latitude, lastPoint.longitude, lat, lon)
      }

      const point: TrackPoint = {
        latitude: lat,
        longitude: lon,
        time,
        distance: cumulativeDistance,
      }

      trackPoints.push(point)
      lastPoint = point
    }
  }

  return trackPoints
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
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
