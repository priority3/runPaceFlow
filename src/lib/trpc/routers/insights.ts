/**
 * Insights tRPC Router
 *
 * Cache-only query for AI-generated activity insights.
 * Generation is handled by the SSE streaming endpoint at /api/insights/stream.
 */

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { activityInsights } from '@/lib/db/schema'

import { createTRPCRouter, publicProcedure } from '../server'

export const insightsRouter = createTRPCRouter({
  /**
   * Get cached insight for an activity.
   * Returns null if no cached insight exists (front-end should initiate SSE stream).
   */
  getForActivity: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const cached = await ctx.db
        .select()
        .from(activityInsights)
        .where(eq(activityInsights.activityId, input.activityId))
        .limit(1)

      if (cached.length === 0) {
        return null
      }

      return {
        content: cached[0].content,
        generatedAt: cached[0].generatedAt,
        model: cached[0].model,
        cached: true,
      }
    }),
})
