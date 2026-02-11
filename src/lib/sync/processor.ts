import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { activities, splits } from '@/lib/db/schema'
import { calculatePace } from '@/lib/pace/calculator'
import { generateId } from '@/lib/utils'
import { fetchWeatherForActivity } from '@/lib/weather/open-meteo'

import type { RawActivity } from './adapters/base'
import {
  calculateDistance,
  calculateElevationGain,
  calculateTrackDistance,
  parseGPX,
} from './parser'
import { extractCoordinatesFromGPX, matchRaceForActivity } from './race-matcher'

/**
 * 数据处理器
 * 将原始活动数据转换并存储到数据库
 */

/**
 * 同步单个活动到数据库
 * @param rawActivity 原始活动数据
 * @returns 活动 ID
 */
export async function syncActivity(rawActivity: RawActivity): Promise<string> {
  try {
    // 检查活动是否已存在
    const existing = await db
      .select()
      .from(activities)
      .where(eq(activities.sourceId, rawActivity.id))
      .limit(1)

    if (existing.length > 0) {
      console.info(`Activity ${rawActivity.id} already exists, skipping...`)
      return existing[0].id
    }

    // 解析 GPX 数据
    let gpxData = null
    let parsedGPX = null
    if (rawActivity.gpxData) {
      try {
        parsedGPX = parseGPX(rawActivity.gpxData)
        gpxData = rawActivity.gpxData
      } catch (error) {
        console.warn(`Failed to parse GPX for activity ${rawActivity.id}:`, error)
      }
    }

    // 计算活动的基础数据
    const distance = rawActivity.distance || 0
    const duration = rawActivity.duration || 0
    const averagePace =
      rawActivity.averagePace || (distance > 0 ? calculatePace(distance, duration) : 0)

    // 匹配赛事名称（半马以上距离）
    let raceName: string | null = null
    if (distance >= 20500) {
      const coords = extractCoordinatesFromGPX(gpxData)
      raceName = await matchRaceForActivity(rawActivity.startTime, distance, coords)
      if (raceName) {
        console.info(`Matched race: ${raceName} for activity ${rawActivity.id}`)
      }
    }

    // 获取天气数据（仅室外活动）
    let weatherData: string | null = null
    if (!rawActivity.isIndoor) {
      try {
        const coords = extractCoordinatesFromGPX(gpxData)
        if (coords) {
          const weather = await fetchWeatherForActivity(
            coords.lat,
            coords.lng,
            rawActivity.startTime,
          )
          if (weather) {
            weatherData = JSON.stringify(weather)
            console.info(
              `Weather for activity ${rawActivity.id}: ${weather.temperature}°C, ${weather.description}`,
            )
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch weather for activity ${rawActivity.id}:`, error)
      }
    }

    // 创建活动记录
    const activityId = generateId('act')
    const endTime = new Date(rawActivity.startTime.getTime() + duration * 1000)

    await db.insert(activities).values({
      id: activityId,
      title: rawActivity.title,
      type: rawActivity.type,
      source: rawActivity.source,
      sourceId: rawActivity.id,
      startTime: rawActivity.startTime,
      endTime,
      duration,
      distance,
      averagePace,
      bestPace: rawActivity.bestPace, // 瞬时最快配速（来自 Strava max_speed）
      elevationGain: rawActivity.elevationGain,
      averageHeartRate: rawActivity.averageHeartRate,
      maxHeartRate: rawActivity.maxHeartRate,
      calories: rawActivity.calories,
      gpxData,
      isIndoor: rawActivity.isIndoor ?? false,
      raceName,
      weatherData,
    })

    // 生成分段数据
    if (parsedGPX && parsedGPX.tracks.length > 0) {
      await generateSplits(activityId, parsedGPX.tracks[0].points)
    } else if (distance > 0 && duration > 0) {
      // 如果没有 GPX 数据，根据总距离和时长生成平均分段
      await generateAverageSplits(activityId, distance, duration, averagePace)
    }

    console.info(`Successfully synced activity ${activityId} (source: ${rawActivity.source})`)
    return activityId
  } catch (error) {
    console.error(`Failed to sync activity ${rawActivity.id}:`, error)
    throw error
  }
}

/**
 * 批量同步活动
 * @param rawActivities 原始活动数组
 * @returns 同步的活动 ID 数组
 */
export async function syncActivities(rawActivities: RawActivity[]): Promise<string[]> {
  const activityIds: string[] = []

  for (const rawActivity of rawActivities) {
    try {
      const id = await syncActivity(rawActivity)
      activityIds.push(id)
    } catch (error) {
      console.error(`Failed to sync activity ${rawActivity.id}, continuing...`, error)
    }
  }

  return activityIds
}

/**
 * 根据 GPX 轨迹点生成分段数据
 * @param activityId 活动 ID
 * @param points GPX 轨迹点
 */
async function generateSplits(
  activityId: string,
  points: Array<{ lat: number; lon: number; time?: Date; ele?: number; hr?: number }>,
): Promise<void> {
  if (points.length < 2) return

  const splitRecords: Array<{
    id: string
    activityId: string
    kilometer: number
    duration: number
    pace: number
    distance: number
    elevationGain?: number
    averageHeartRate?: number
  }> = []

  let kmCount = 0
  let kmStartIndex = 0
  let totalDistance = 0

  for (let i = 1; i < points.length; i++) {
    const segmentDistance = calculateDistance(points[i - 1], points[i])
    totalDistance += segmentDistance

    // 每累计 1000 米创建一个分段
    if (totalDistance >= (kmCount + 1) * 1000) {
      const splitPoints = points.slice(kmStartIndex, i + 1)

      // 计算分段时长
      const startTime = splitPoints[0].time
      const endTime = splitPoints.at(-1)?.time
      const splitDuration =
        startTime && endTime ? (endTime.getTime() - startTime.getTime()) / 1000 : 0

      // 计算分段距离
      const splitDistance = calculateTrackDistance(splitPoints)

      // 计算配速
      const splitPace = splitDistance > 0 ? calculatePace(splitDistance, splitDuration) : 0

      // 计算海拔上升
      const splitElevationGain = calculateElevationGain(splitPoints)

      // 计算平均心率
      const heartRates = splitPoints.map((p) => p.hr).filter((hr) => hr != null)
      const avgHeartRate =
        heartRates.length > 0
          ? Math.round(heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length)
          : undefined

      splitRecords.push({
        id: generateId('split'),
        activityId,
        kilometer: kmCount + 1,
        duration: Math.round(splitDuration),
        pace: splitPace,
        distance: splitDistance,
        elevationGain: splitElevationGain > 0 ? splitElevationGain : undefined,
        averageHeartRate: avgHeartRate,
      })

      kmCount++
      kmStartIndex = i
    }
  }

  // 插入分段数据
  if (splitRecords.length > 0) {
    await db.insert(splits).values(splitRecords)
    console.info(`Generated ${splitRecords.length} splits for activity ${activityId}`)

    // 计算最佳配速（配速数值最小的分段）并更新活动记录
    const validPaces = splitRecords.map((r) => r.pace).filter((p) => p > 0)
    if (validPaces.length > 0) {
      const bestPace = Math.min(...validPaces)
      await db.update(activities).set({ bestPace }).where(eq(activities.id, activityId))
      console.info(`Updated bestPace for activity ${activityId}: ${bestPace.toFixed(1)} sec/km`)
    }
  }
}

/**
 * 生成平均分段数据（无 GPX 数据时使用）
 * @param activityId 活动 ID
 * @param totalDistance 总距离（米）
 * @param totalDuration 总时长（秒）
 * @param averagePace 平均配速（秒/公里）
 */
async function generateAverageSplits(
  activityId: string,
  totalDistance: number,
  totalDuration: number,
  averagePace: number,
): Promise<void> {
  const kmCount = Math.floor(totalDistance / 1000)
  if (kmCount === 0) return

  const splitRecords = []
  const avgSplitDuration = Math.round(totalDuration / (totalDistance / 1000))

  for (let i = 1; i <= kmCount; i++) {
    splitRecords.push({
      id: generateId('split'),
      activityId,
      kilometer: i,
      duration: avgSplitDuration,
      pace: averagePace,
      distance: 1000,
    })
  }

  if (splitRecords.length > 0) {
    await db.insert(splits).values(splitRecords)
    console.info(`Generated ${splitRecords.length} average splits for activity ${activityId}`)
  }
}

/**
 * 回填缺失天气数据的统计结果
 */
export interface BackfillWeatherResult {
  total: number
  success: number
  failed: number
  skipped: number
}

/**
 * 为缺少天气数据的室外活动批量获取天气
 *
 * 查询 weather_data 为空、非室内、且有 GPX 数据的活动，
 * 逐条获取历史天气并更新数据库。
 *
 * @param delayMs 请求间隔（毫秒），避免 Open-Meteo 限流
 */
export async function backfillMissingWeather(delayMs = 1000): Promise<BackfillWeatherResult> {
  const allActivities = await db.select().from(activities).all()

  const eligible = allActivities.filter(
    (a) => a.weatherData === null && a.isIndoor === false && a.gpxData !== null,
  )

  if (eligible.length === 0) {
    return { total: 0, success: 0, failed: 0, skipped: 0 }
  }

  console.info(`\n🌤️  Backfilling weather for ${eligible.length} activities...`)

  let success = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < eligible.length; i++) {
    const activity = eligible[i]

    const coords = extractCoordinatesFromGPX(activity.gpxData)
    if (!coords) {
      skipped++
      continue
    }

    try {
      const weather = await fetchWeatherForActivity(coords.lat, coords.lng, activity.startTime)

      if (weather) {
        await db
          .update(activities)
          .set({ weatherData: JSON.stringify(weather) })
          .where(eq(activities.id, activity.id))
        success++
        console.info(
          `  [${i + 1}/${eligible.length}] ${activity.title}: ${weather.description} ${weather.temperature}°C`,
        )
      } else {
        failed++
      }
    } catch {
      failed++
    }

    // Reason: Delay between requests to respect Open-Meteo rate limits
    if (i < eligible.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  console.info(`🌤️  Weather backfill done: ${success} ok, ${failed} failed, ${skipped} skipped`)
  return { total: eligible.length, success, failed, skipped }
}

/**
 * 删除活动
 * @param activityId 活动 ID
 */
export async function deleteActivity(activityId: string): Promise<void> {
  await db.delete(activities).where(eq(activities.id, activityId))
  console.info(`Deleted activity ${activityId}`)
}
