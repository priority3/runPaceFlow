/**
 * Activity Sync tRPC Router
 *
 * Handles Nike Run Club and Strava data synchronization
 */

// Helper import
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { NikeAdapter } from '@/lib/sync/adapters/nike'
import { StravaAdapter } from '@/lib/sync/adapters/strava'
import { syncActivities } from '@/lib/sync/processor'

import { createTRPCRouter, publicProcedure } from '../server'

export const syncRouter = createTRPCRouter({
  /**
   * Sync Nike Run Club activities
   */
  syncNike: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
      }),
    )
    .mutation(async ({ input }) => {
      // 优先使用 refresh_token（可自动刷新）
      const refreshToken = process.env.NIKE_REFRESH_TOKEN
      const accessToken = process.env.NIKE_ACCESS_TOKEN

      if (!refreshToken && !accessToken) {
        throw new Error(
          'Nike token not configured. Please set NIKE_REFRESH_TOKEN or NIKE_ACCESS_TOKEN in .env.local',
        )
      }

      try {
        // 创建 Nike 适配器
        // 如果有 refresh_token，会自动刷新 access_token
        const adapter = refreshToken
          ? new NikeAdapter(refreshToken, refreshToken) // 使用 refresh_token（自动刷新）
          : new NikeAdapter(accessToken!) // 使用 access_token（手动模式）

        // 获取活动数据
        const rawActivities = await adapter.getActivities({
          limit: input.limit,
        })

        // 同步到数据库
        const syncedIds = await syncActivities(rawActivities)

        return {
          success: true,
          count: syncedIds.length,
          activityIds: syncedIds,
          message: `Successfully synced ${syncedIds.length} activities from Nike Run Club`,
        }
      } catch (error) {
        console.error('Nike sync error:', error)
        throw new Error(
          `Failed to sync Nike activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }),

  /**
   * Sync Strava activities
   */
  syncStrava: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const clientId = process.env.STRAVA_CLIENT_ID
      const clientSecret = process.env.STRAVA_CLIENT_SECRET
      const refreshToken = process.env.STRAVA_REFRESH_TOKEN

      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error(
          'Strava credentials not configured. Please set STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REFRESH_TOKEN in .env.local',
        )
      }

      try {
        // Create Strava adapter with OAuth credentials
        const adapter = new StravaAdapter(clientId, clientSecret, refreshToken)

        // Authenticate and verify credentials
        const authenticated = await adapter.authenticate({})
        if (!authenticated) {
          throw new Error('Strava authentication failed. Please check your credentials.')
        }

        // Get activities with optional date filters
        const rawActivities = await adapter.getActivities({
          limit: input.limit,
          startDate: input.startDate,
          endDate: input.endDate,
        })

        // Sync to database
        const syncedIds = await syncActivities(rawActivities)

        return {
          success: true,
          count: syncedIds.length,
          activityIds: syncedIds,
          message: `Successfully synced ${syncedIds.length} activities from Strava`,
        }
      } catch (error) {
        console.error('Strava sync error:', error)
        throw new Error(
          `Failed to sync Strava activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }),

  /**
   * Get sync status
   */
  getSyncStatus: publicProcedure.query(async ({ ctx }) => {
    // 从数据库获取最新的同步日志
    const { syncLogs } = await import('@/lib/db/schema')
    const { desc } = await import('drizzle-orm')

    // Get latest Nike sync log
    const latestNikeLog = await ctx.db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.source, 'nike'))
      .orderBy(desc(syncLogs.startedAt))
      .limit(1)

    // Get latest Strava sync log
    const latestStravaLog = await ctx.db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.source, 'strava'))
      .orderBy(desc(syncLogs.startedAt))
      .limit(1)

    return {
      nike: {
        hasToken: !!(process.env.NIKE_REFRESH_TOKEN || process.env.NIKE_ACCESS_TOKEN),
        hasRefreshToken: !!process.env.NIKE_REFRESH_TOKEN,
        latestSync: latestNikeLog[0] || null,
      },
      strava: {
        hasCredentials: !!(
          process.env.STRAVA_CLIENT_ID &&
          process.env.STRAVA_CLIENT_SECRET &&
          process.env.STRAVA_REFRESH_TOKEN
        ),
        latestSync: latestStravaLog[0] || null,
      },
    }
  }),
})
