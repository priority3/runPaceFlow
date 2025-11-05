/**
 * 测试数据生成器
 * 用于开发和演示配速可视化功能
 */

import type { TrackPoint } from '@/lib/map/pace-utils'

/**
 * 生成模拟的 GPS 轨迹数据
 * 创建一个环形路线，带有变化的配速
 */
export function generateMockTrackPoints(): TrackPoint[] {
  const points: TrackPoint[] = []
  const startTime = new Date('2025-01-05T06:00:00Z')
  const centerLat = 39.90923
  const centerLng = 116.397428
  const radius = 0.02 // 约 2km

  // 生成 500 个点，模拟 5km 跑步
  const totalPoints = 500
  const totalDistance = 5000 // 5km
  const totalDuration = 1800 // 30 分钟

  for (let i = 0; i < totalPoints; i++) {
    const progress = i / totalPoints
    const angle = progress * Math.PI * 2 // 完整圆圈

    // 位置（圆形路线）
    const longitude = centerLng + radius * Math.cos(angle)
    const latitude = centerLat + radius * Math.sin(angle)

    // 距离（线性增长）
    const distance = progress * totalDistance

    // 时间（模拟配速变化）
    // 开始慢，中间快，结束慢
    let timeProgress = progress
    if (progress < 0.2) {
      // 开始 20%：慢速热身
      timeProgress = progress * 1.3
    } else if (progress < 0.8) {
      // 中间 60%：快速
      timeProgress = 0.26 + (progress - 0.2) * 0.9
    } else {
      // 结束 20%：减速
      timeProgress = 0.8 + (progress - 0.8) * 1.2
    }

    const time = new Date(startTime.getTime() + timeProgress * totalDuration * 1000)

    // 海拔（可选）
    const elevation = 50 + Math.sin(angle * 2) * 10

    points.push({
      longitude,
      latitude,
      elevation,
      time,
      distance,
    })
  }

  return points
}
