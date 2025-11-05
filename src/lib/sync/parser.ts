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
export function parseGPX(_gpxString: string): GPXData {
  // TODO: 实现完整的 GPX 解析
  // 这里需要使用 XML 解析库（如 fast-xml-parser）

  // 临时实现：返回空数据结构
  console.warn('GPX parser: parseGPX not fully implemented yet')

  return {
    tracks: [],
    totalDistance: 0,
    totalDuration: 0,
    elevationGain: 0,
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
export function simplifyTrack(points: GPXPoint[], _tolerance = 0.0001): GPXPoint[] {
  if (points.length <= 2) return points

  // TODO: 实现 Douglas-Peucker 算法
  // 临时实现：每隔 n 个点保留一个
  const step = Math.max(1, Math.floor(points.length / 500))
  return points.filter((_, index) => index % step === 0 || index === points.length - 1)
}
