/**
 * 配速计算器
 * 提供各种配速相关的计算功能
 */

/**
 * 计算配速（秒/公里）
 * @param distance 距离（米）
 * @param duration 时长（秒）
 * @returns 配速（秒/公里）
 */
export function calculatePace(distance: number, duration: number): number {
  if (distance <= 0) return 0
  return (duration / distance) * 1000 // 秒/公里
}

/**
 * 格式化配速为 MM:SS
 * @param paceInSeconds 配速（秒/公里）
 * @param includeUnit 是否包含单位 /km（默认 false）
 * @returns 格式化的配速字符串
 */
export function formatPace(paceInSeconds: number, includeUnit = false): string {
  const minutes = Math.floor(paceInSeconds / 60)
  const seconds = Math.floor(paceInSeconds % 60)
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`
  return includeUnit ? `${formatted}/km` : formatted
}

/**
 * 计算速度（km/h）
 * @param distance 距离（米）
 * @param duration 时长（秒）
 * @returns 速度（km/h）
 */
export function calculateSpeed(distance: number, duration: number): number {
  if (duration <= 0) return 0
  return (distance / 1000 / duration) * 3600 // km/h
}

/**
 * 配速转速度
 * @param paceInSeconds 配速（秒/公里）
 * @returns 速度（km/h）
 */
export function paceToSpeed(paceInSeconds: number): number {
  if (paceInSeconds <= 0) return 0
  return 3600 / paceInSeconds
}

/**
 * 速度转配速
 * @param speedInKmH 速度（km/h）
 * @returns 配速（秒/公里）
 */
export function speedToPace(speedInKmH: number): number {
  if (speedInKmH <= 0) return 0
  return 3600 / speedInKmH
}

/**
 * 格式化时长为 HH:MM:SS 或 MM:SS
 * @param seconds 秒数
 * @returns 格式化的时长字符串
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * 格式化距离
 * @param meters 米
 * @param precision 小数位数
 * @returns 格式化的距离字符串
 */
export function formatDistance(meters: number, precision = 2): string {
  const km = meters / 1000
  return `${km.toFixed(precision)} km`
}

/**
 * 配速区间定义
 */
export interface PaceZone {
  name: string
  minPace: number // 秒/公里
  maxPace: number // 秒/公里
  color: string
}

/**
 * 获取配速颜色（用于地图渲染）
 * @param pace 配速（秒/公里）
 * @param averagePace 平均配速（秒/公里）
 * @returns 颜色值
 */
export function getPaceColor(pace: number, averagePace: number): string {
  const diff = pace - averagePace

  // 比平均配速快超过 30 秒：绿色
  if (diff < -30) return '#22c55e'
  // 比平均配速快 0-30 秒：浅绿色
  if (diff < 0) return '#84cc16'
  // 与平均配速接近（±10秒）：黄色
  if (diff < 10) return '#eab308'
  // 比平均配速慢 10-30 秒：橙色
  if (diff < 30) return '#f97316'
  // 比平均配速慢超过 30 秒：红色
  return '#ef4444'
}

/**
 * 计算配速一致性（标准差）
 * 越小表示配速越稳定
 * @param paces 配速数组（秒/公里）
 * @returns 标准差
 */
export function calculatePaceConsistency(paces: number[]): number {
  if (paces.length === 0) return 0

  const mean = paces.reduce((sum, pace) => sum + pace, 0) / paces.length
  const variance = paces.reduce((sum, pace) => sum + Math.pow(pace - mean, 2), 0) / paces.length

  return Math.sqrt(variance)
}
