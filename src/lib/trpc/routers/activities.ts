/**
 * Activities tRPC Router
 *
 * Handles all activity-related API endpoints
 */

import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { activities, splits } from '@/lib/db/schema'

import { createTRPCRouter, publicProcedure } from '../server'

export const activitiesRouter = createTRPCRouter({
  /**
   * Get list of activities with optional filtering
   */
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional().default(20),
          offset: z.number().min(0).optional().default(0),
          type: z.enum(['running', 'cycling', 'walking']).optional(),
          source: z.enum(['nike', 'strava', 'garmin']).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { limit = 20, offset = 0, type, source } = input || {}

      // Build the query
      let query = ctx.db
        .select()
        .from(activities)
        .orderBy(desc(activities.startTime))
        .limit(limit)
        .offset(offset)

      // Apply filters
      const conditions = []
      if (type) {
        conditions.push(eq(activities.type, type))
      }
      if (source) {
        conditions.push(eq(activities.source, source))
      }

      if (conditions.length > 0) {
        query = query.where(conditions[0]) as any
      }

      const result = await query

      // Get total count for pagination
      const totalCount = await ctx.db.select().from(activities)

      return {
        activities: result,
        pagination: {
          total: totalCount.length,
          limit,
          offset,
          hasMore: offset + limit < totalCount.length,
        },
      }
    }),

  /**
   * Get activity by ID with full details
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const activity = await ctx.db
      .select()
      .from(activities)
      .where(eq(activities.id, input.id))
      .limit(1)

    if (!activity || activity.length === 0) {
      throw new Error('Activity not found')
    }

    return activity[0]
  }),

  /**
   * Get splits for an activity
   */
  getSplits: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const activitySplits = await ctx.db
        .select()
        .from(splits)
        .where(eq(splits.activityId, input.activityId))
        .orderBy(splits.kilometer)

      return activitySplits
    }),

  /**
   * Get activity with splits (combined query)
   */
  getWithSplits: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.db
        .select()
        .from(activities)
        .where(eq(activities.id, input.id))
        .limit(1)

      if (!activity || activity.length === 0) {
        throw new Error('Activity not found')
      }

      const activitySplits = await ctx.db
        .select()
        .from(splits)
        .where(eq(splits.activityId, input.id))
        .orderBy(splits.kilometer)

      return {
        activity: activity[0],
        splits: activitySplits,
      }
    }),

  /**
   * Get activity statistics with trend comparison
   */
  getStats: publicProcedure.query(async ({ ctx }) => {
    const allActivities = await ctx.db.select().from(activities)

    const totalDistance = allActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0)
    const totalDuration = allActivities.reduce((sum, activity) => sum + (activity.duration || 0), 0)
    const totalElevation = allActivities.reduce(
      (sum, activity) => sum + (activity.elevationGain || 0),
      0,
    )

    // Calculate average pace from all activities
    const activitiesWithPace = allActivities.filter((a) => a.averagePace && a.averagePace > 0)
    const avgPace =
      activitiesWithPace.length > 0
        ? activitiesWithPace.reduce((sum, a) => sum + (a.averagePace || 0), 0) /
          activitiesWithPace.length
        : 0

    // Calculate this week's stats (last 7 days)
    const now = new Date()
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const thisWeekActivities = allActivities.filter(
      (activity) => new Date(activity.startTime) > oneWeekAgo,
    )

    const thisWeekDistance = thisWeekActivities.reduce(
      (sum, activity) => sum + (activity.distance || 0),
      0,
    )
    const thisWeekDuration = thisWeekActivities.reduce(
      (sum, activity) => sum + (activity.duration || 0),
      0,
    )
    const thisWeekCount = thisWeekActivities.length

    // Calculate last week's stats (7-14 days ago) for trend comparison
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const lastWeekActivities = allActivities.filter((activity) => {
      const activityDate = new Date(activity.startTime)
      return activityDate > twoWeeksAgo && activityDate <= oneWeekAgo
    })

    const lastWeekDistance = lastWeekActivities.reduce(
      (sum, activity) => sum + (activity.distance || 0),
      0,
    )
    const lastWeekDuration = lastWeekActivities.reduce(
      (sum, activity) => sum + (activity.duration || 0),
      0,
    )
    const lastWeekCount = lastWeekActivities.length

    return {
      total: {
        activities: allActivities.length,
        distance: totalDistance,
        duration: totalDuration,
        elevation: totalElevation,
        averagePace: avgPace,
      },
      thisWeek: {
        activities: thisWeekCount,
        distance: thisWeekDistance,
        duration: thisWeekDuration,
      },
      lastWeek: {
        activities: lastWeekCount,
        distance: lastWeekDistance,
        duration: lastWeekDuration,
      },
    }
  }),
})
