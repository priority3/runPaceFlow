/**
 * Insights tRPC Router
 *
 * Cache-only query for AI-generated activity insights. Admin owns generation,
 * caching, and the shared.db connection.
 */

import { z } from 'zod'

import { queryAdmin } from '@/lib/admin-api'

import { createTRPCRouter, publicProcedure } from '../server'

export const insightsRouter = createTRPCRouter({
  /**
   * Get cached insight for an activity.
   * Returns null if no cached insight exists (front-end should initiate SSE stream).
   */
  getForActivity: publicProcedure.input(z.object({ activityId: z.string() })).query(({ input }) =>
    queryAdmin<{
      content: string
      generatedAt: Date
      model: string
      cached: true
    } | null>('insights.getForActivity', input),
  ),
})
