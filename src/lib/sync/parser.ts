import { XMLParser } from 'fast-xml-parser'

/**
 * GPX 坐标点
 */
export interface GPXPoint {
  lat: number
  lon: number
  ele?: number // 海拔
  time?: Date
  hr?: number // 心率
}

/**
 * GPX 轨迹段
 */
export interface GPXTrack {
  name?: string
  type?: string
  points: GPXPoint[]
}

/**
 * GPX 解析结果
 */
export interface GPXData {
  tracks: GPXTrack[]
  totalDistance: number // 总距离（米）
  totalDuration: number // 总时长（秒）
  elevationGain: number // 海拔上升（米）
  startTime?: Date
  endTime?: Date
}

/**
 * 解析 GPX XML 字符串
 * @param gpxString GPX XML 字符串
 * @returns 解析后的 GPX 数据
 */
export function parseGPX(gpxString: string): GPXData {
  // Use fast-xml-parser to parse GPX XML

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
  })

  try {
    const gpx = parser.parse(gpxString)

    // Handle different GPX structure variations
    const gpxRoot = gpx.gpx || gpx

    if (!gpxRoot.trk) {
      console.warn('No track data found in GPX')
      return {
        tracks: [],
        totalDistance: 0,
        totalDuration: 0,
        elevationGain: 0,
      }
    }

    // Normalize tracks to array
    const tracks = Array.isArray(gpxRoot.trk) ? gpxRoot.trk : [gpxRoot.trk]

    const parsedTracks: GPXTrack[] = []
    let globalStartTime: Date | undefined
    let globalEndTime: Date | undefined

    for (const trk of tracks) {
      // Normalize track segments to array
      const segments = Array.isArray(trk.trkseg) ? trk.trkseg : trk.trkseg ? [trk.trkseg] : []

      const points: GPXPoint[] = []

      for (const seg of segments) {
        if (!seg.trkpt) continue

        // Normalize track points to array
        const trkpts = Array.isArray(seg.trkpt) ? seg.trkpt : [seg.trkpt]

        for (const pt of trkpts) {
          // Extract basic coordinates
          const lat = Number.parseFloat(pt['@_lat'])
          const lon = Number.parseFloat(pt['@_lon'])

          if (Number.isNaN(lat) || Number.isNaN(lon)) continue

          const point: GPXPoint = { lat, lon }

          // Extract elevation
          if (pt.ele !== undefined) {
            const ele = Number.parseFloat(pt.ele)
            if (!Number.isNaN(ele)) {
              point.ele = ele
            }
          }

          // Extract time
          if (pt.time) {
            try {
              point.time = new Date(pt.time)
              // Track global start/end times
              if (!globalStartTime || point.time < globalStartTime) {
                globalStartTime = point.time
              }
              if (!globalEndTime || point.time > globalEndTime) {
                globalEndTime = point.time
              }
            } catch {
              console.warn('Failed to parse time:', pt.time)
            }
          }

          // Extract heart rate from Garmin TrackPointExtension
          // Format: <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>145</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>
          if (pt.extensions) {
            const ext = pt.extensions
            // Handle various namespace variations
            const tpx = ext['gpxtpx:TrackPointExtension'] || ext.TrackPointExtension || ext['ns3:TrackPointExtension']

            if (tpx) {
              const hr = tpx['gpxtpx:hr'] || tpx.hr || tpx['ns3:hr']
              if (hr !== undefined) {
                const hrValue = Number.parseInt(hr)
                if (!Number.isNaN(hrValue)) {
                  point.hr = hrValue
                }
              }
            }
          }

          points.push(point)
        }
      }

      if (points.length > 0) {
        parsedTracks.push({
          name: trk.name || undefined,
          type: trk.type || undefined,
          points,
        })
      }
    }

    // Calculate total distance
    let totalDistance = 0
    for (const track of parsedTracks) {
      totalDistance += calculateTrackDistance(track.points)
    }

    // Calculate elevation gain
    let elevationGain = 0
    for (const track of parsedTracks) {
      elevationGain += calculateElevationGain(track.points)
    }

    // Calculate duration
    let totalDuration = 0
    if (globalStartTime && globalEndTime) {
      totalDuration = (globalEndTime.getTime() - globalStartTime.getTime()) / 1000 // seconds
    }

    return {
      tracks: parsedTracks,
      totalDistance,
      totalDuration,
      elevationGain,
      startTime: globalStartTime,
      endTime: globalEndTime,
    }
  } catch (error) {
    console.error('Failed to parse GPX:', error)
    return {
      tracks: [],
      totalDistance: 0,
      totalDuration: 0,
      elevationGain: 0,
    }
  }
}

/**
 * 计算两个坐标点之间的距离（米）
 * 使用 Haversine 公式
 */
export function calculateDistance(point1: { lat: number; lon: number }, point2: { lat: number; lon: number }): number {
  const R = 6371e3 // 地球半径（米）
  const φ1 = (point1.lat * Math.PI) / 180
  const φ2 = (point2.lat * Math.PI) / 180
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180
  const Δλ = ((point2.lon - point1.lon) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // 距离（米）
}

/**
 * 计算轨迹的总距离
 */
export function calculateTrackDistance(points: GPXPoint[]): number {
  let totalDistance = 0
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i - 1], points[i])
  }
  return totalDistance
}

/**
 * 计算海拔上升
 */
export function calculateElevationGain(points: GPXPoint[]): number {
  let gain = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].ele ?? 0
    const curr = points[i].ele ?? 0
    const diff = curr - prev
    if (diff > 0) {
      gain += diff
    }
  }
  return gain
}

/**
 * 简化轨迹（Douglas-Peucker 算法）
 * 用于减少地图渲染的点数
 */
export function simplifyTrack(points: GPXPoint[], tolerance = 0.0001): GPXPoint[] {
  if (points.length <= 2) return points

  // Douglas-Peucker 算法实现
  // Reason: 递归分治算法，保留关键拐点，移除冗余点

  // 计算点到线段的垂直距离
  function perpendicularDistance(point: GPXPoint, lineStart: GPXPoint, lineEnd: GPXPoint): number {
    const { lat: x, lon: y } = point
    const { lat: x1, lon: y1 } = lineStart
    const { lat: x2, lon: y2 } = lineEnd

    const dx = x2 - x1
    const dy = y2 - y1

    // 如果线段是一个点，直接返回点到点的距离
    if (dx === 0 && dy === 0) {
      return Math.hypot(x - x1, y - y1)
    }

    // 计算垂直距离
    const numerator = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1)
    const denominator = Math.hypot(dx, dy)

    return numerator / denominator
  }

  // 递归简化
  function douglasPeucker(points: GPXPoint[], start: number, end: number, tolerance: number): boolean[] {
    const keep = Array.from({ length: points.length }, () => false)
    keep[start] = true
    keep[end] = true

    if (end - start <= 1) return keep

    // 找到距离最远的点
    let maxDistance = 0
    let maxIndex = start

    for (let i = start + 1; i < end; i++) {
      const distance = perpendicularDistance(points[i], points[start], points[end])
      if (distance > maxDistance) {
        maxDistance = distance
        maxIndex = i
      }
    }

    // 如果最大距离大于容差，递归简化
    if (maxDistance > tolerance) {
      const left = douglasPeucker(points, start, maxIndex, tolerance)
      const right = douglasPeucker(points, maxIndex, end, tolerance)

      for (let i = 0; i < points.length; i++) {
        if (left[i] || right[i]) {
          keep[i] = true
        }
      }
    }

    return keep
  }

  const keep = douglasPeucker(points, 0, points.length - 1, tolerance)
  return points.filter((_, index) => keep[index])
}
