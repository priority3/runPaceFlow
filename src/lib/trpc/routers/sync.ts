/**
 * Nike Sync tRPC Router
 *
 * Handles Nike Run Club data synchronization
 */

// Helper import
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { NikeAdapter } from '@/lib/sync/adapters/nike'
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
        throw new Error('Nike token not configured. Please set NIKE_REFRESH_TOKEN or NIKE_ACCESS_TOKEN in .env.local')
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
        throw new Error(`Failed to sync Nike activities: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }),

  /**
   * Get sync status
   */
  getSyncStatus: publicProcedure.query(async ({ ctx }) => {
    // 从数据库获取最新的同步日志
    const { syncLogs } = await import('@/lib/db/schema')
    const { desc } = await import('drizzle-orm')

    const latestLog = await ctx.db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.source, 'nike'))
      .orderBy(desc(syncLogs.startedAt))
      .limit(1)

    return {
      hasToken: !!(process.env.NIKE_REFRESH_TOKEN || process.env.NIKE_ACCESS_TOKEN),
      hasRefreshToken: !!process.env.NIKE_REFRESH_TOKEN,
      latestSync: latestLog[0] || null,
    }
  }),
})
