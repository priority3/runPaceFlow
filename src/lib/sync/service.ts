import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { syncLogs, userProfile } from '@/lib/db/schema'
import { generateId } from '@/lib/utils'

import type { SyncAdapter } from './adapters/base'
import { NikeAdapter } from './adapters/nike'
import { syncActivities } from './processor'
import { cleanupRaceMatcher, initRaceMatcher } from './race-matcher'

/**
 * 同步服务
 * 负责协调数据源的同步流程
 */

export type SyncSource = 'nike' | 'strava' | 'garmin'

/**
 * 同步选项
 */
export interface SyncOptions {
  /** 数据源 */
  source: SyncSource
  /** 开始日期 */
  startDate?: Date
  /** 结束日期 */
  endDate?: Date
  /** 限制数量 */
  limit?: number
}

/**
 * 同步结果
 */
export interface SyncResult {
  /** 是否成功 */
  success: boolean
  /** 同步的活动数量 */
  activitiesCount: number
  /** 错误信息 */
  errorMessage?: string
  /** 同步日志 ID */
  logId: string
}

/**
 * 创建适配器实例
 * @param source 数据源
 * @param accessToken 访问令牌
 * @returns 适配器实例
 */
function createAdapter(source: SyncSource, accessToken: string): SyncAdapter {
  switch (source) {
    case 'nike': {
      return new NikeAdapter(accessToken)
    }
    case 'strava': {
      throw new Error('Strava adapter not implemented yet')
    }
    case 'garmin': {
      throw new Error('Garmin adapter not implemented yet')
    }
    default: {
      throw new Error(`Unknown sync source: ${source}`)
    }
  }
}

/**
 * 执行数据同步
 * @param options 同步选项
 * @returns 同步结果
 */
export async function performSync(options: SyncOptions): Promise<SyncResult> {
  const { source, startDate, endDate, limit } = options

  // 创建同步日志
  const logId = generateId('log')
  const startedAt = new Date()

  await db.insert(syncLogs).values({
    id: logId,
    source,
    status: 'running',
    startedAt,
  })

  try {
    // 初始化赛事匹配器（启动 Playwright 浏览器）
    await initRaceMatcher()

    // 获取访问令牌
    const profile = await getUserProfile()
    const accessToken = getAccessToken(profile, source)

    if (!accessToken) {
      throw new Error(`No access token found for ${source}`)
    }

    // 创建适配器
    const adapter = createAdapter(source, accessToken)

    // 健康检查
    const isHealthy = await adapter.healthCheck()
    if (!isHealthy) {
      throw new Error(`${source} service is not available`)
    }

    // 获取活动列表
    console.info(`Fetching activities from ${source}...`)
    const rawActivities = await adapter.getActivities({
      startDate,
      endDate,
      limit,
    })

    console.info(`Found ${rawActivities.length} activities from ${source}`)

    // 同步活动到数据库
    const activityIds = await syncActivities(rawActivities)

    // 更新同步日志
    await db
      .update(syncLogs)
      .set({
        status: 'success',
        activitiesCount: activityIds.length,
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, logId))

    // 更新用户的最后同步时间
    await updateLastSyncTime(source)

    // 清理赛事匹配器资源
    await cleanupRaceMatcher()

    return {
      success: true,
      activitiesCount: activityIds.length,
      logId,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Sync failed for ${source}:`, errorMessage)

    // 清理赛事匹配器资源（即使失败也要清理）
    await cleanupRaceMatcher()

    // 更新同步日志为失败状态
    await db
      .update(syncLogs)
      .set({
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, logId))

    return {
      success: false,
      activitiesCount: 0,
      errorMessage,
      logId,
    }
  }
}

/**
 * 获取用户配置
 */
async function getUserProfile() {
  const profiles = await db.select().from(userProfile).limit(1)

  if (profiles.length === 0) {
    // 创建默认用户配置
    const defaultProfileData = {
      id: generateId('user'),
      name: 'Runner',
    }
    await db.insert(userProfile).values(defaultProfileData)

    // 重新获取完整的配置数据
    const newProfiles = await db.select().from(userProfile).limit(1)
    return newProfiles[0]
  }

  return profiles[0]
}

/**
 * 获取访问令牌
 */
function getAccessToken(
  profile: {
    nikeAccessToken?: string | null
    stravaAccessToken?: string | null
    garminSecretString?: string | null
  },
  source: SyncSource,
): string | null {
  switch (source) {
    case 'nike': {
      return profile.nikeAccessToken || process.env.NIKE_ACCESS_TOKEN || null
    }
    case 'strava': {
      return profile.stravaAccessToken || process.env.STRAVA_ACCESS_TOKEN || null
    }
    case 'garmin': {
      return profile.garminSecretString || process.env.GARMIN_SECRET_STRING || null
    }
    default: {
      return null
    }
  }
}

/**
 * 更新最后同步时间
 */
async function updateLastSyncTime(source: SyncSource): Promise<void> {
  const profiles = await db.select().from(userProfile).limit(1)

  if (profiles.length > 0) {
    await db
      .update(userProfile)
      .set({
        lastSyncAt: new Date(),
        syncSource: source,
      })
      .where(eq(userProfile.id, profiles[0].id))
  }
}

/**
 * 获取同步历史
 * @param limit 限制数量
 * @returns 同步日志列表
 */
export async function getSyncHistory(limit = 10) {
  return await db.select().from(syncLogs).orderBy(syncLogs.startedAt).limit(limit)
}

/**
 * 测试数据源连接
 * @param source 数据源
 * @returns 是否连接成功
 */
export async function testConnection(source: SyncSource): Promise<boolean> {
  try {
    const profile = await getUserProfile()
    const accessToken = getAccessToken(profile, source)

    if (!accessToken) {
      console.error(`No access token found for ${source}`)
      return false
    }

    const adapter = createAdapter(source, accessToken)
    return await adapter.healthCheck()
  } catch (error) {
    console.error(`Connection test failed for ${source}:`, error)
    return false
  }
}
