/**
 * Insights tRPC Router
 *
 * Handles AI-generated activity insights with database caching
 */

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { generateActivityInsight } from '@/lib/ai/provider'
import { activities, activityInsights, splits } from '@/lib/db/schema'

import { createTRPCRouter, publicProcedure } from '../server'

/**
 * Generate a unique ID for insights
 */
function generateInsightId(): string {
  return `insight_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export const insightsRouter = createTRPCRouter({
  /**
   * Get insight for an activity (uses cache if available)
   */
  getForActivity: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check cache first
      const cachedInsight = await ctx.db
        .select()
        .from(activityInsights)
        .where(eq(activityInsights.activityId, input.activityId))
        .limit(1)

      if (cachedInsight.length > 0) {
        return {
          content: cachedInsight[0].content,
          generatedAt: cachedInsight[0].generatedAt,
          model: cachedInsight[0].model,
          cached: true,
        }
      }

      // If not cached, generate new insight
      const activity = await ctx.db
        .select()
        .from(activities)
        .where(eq(activities.id, input.activityId))
        .limit(1)

      if (activity.length === 0) {
        throw new Error('Activity not found')
      }

      const activitySplits = await ctx.db
        .select()
        .from(splits)
        .where(eq(splits.activityId, input.activityId))
        .orderBy(splits.kilometer)

      // Generate insight
      const result = await generateActivityInsight({
        activity: activity[0],
        splits: activitySplits,
      })

      const now = new Date()

      // Reason: Vercel serverless has a read-only filesystem, so SQLite writes
      // may fail. Cache best-effort; still return the insight on write failure.
      try {
        await ctx.db.insert(activityInsights).values({
          id: generateInsightId(),
          activityId: input.activityId,
          content: result.content,
          generatedAt: now,
          model: result.model,
        })
      } catch (err) {
        console.warn('Failed to cache insight (read-only DB):', (err as Error).message)
      }

      return {
        content: result.content,
        generatedAt: now,
        model: result.model,
        cached: false,
      }
    }),

  /**
   * Regenerate insight for an activity (forces new generation)
   */
  regenerate: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get activity data
      const activity = await ctx.db
        .select()
        .from(activities)
        .where(eq(activities.id, input.activityId))
        .limit(1)

      if (activity.length === 0) {
        throw new Error('Activity not found')
      }

      const activitySplits = await ctx.db
        .select()
        .from(splits)
        .where(eq(splits.activityId, input.activityId))
        .orderBy(splits.kilometer)

      // Generate new insight
      const result = await generateActivityInsight({
        activity: activity[0],
        splits: activitySplits,
      })

      const now = new Date()

      // Reason: Same read-only filesystem guard as getForActivity above.
      try {
        await ctx.db
          .delete(activityInsights)
          .where(eq(activityInsights.activityId, input.activityId))
        await ctx.db.insert(activityInsights).values({
          id: generateInsightId(),
          activityId: input.activityId,
          content: result.content,
          generatedAt: now,
          model: result.model,
        })
      } catch (err) {
        console.warn('Failed to cache regenerated insight (read-only DB):', (err as Error).message)
      }

      return {
        content: result.content,
        generatedAt: now,
        model: result.model,
        cached: false,
      }
    }),
})
