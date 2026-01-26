/**
 * tRPC Main App Router
 *
 * This is the main router that combines all feature routers
 */

import { createTRPCRouter } from '../server'
import { activitiesRouter } from './activities'
import { insightsRouter } from './insights'
import { syncRouter } from './sync'

/**
 * Main tRPC router
 * Add more routers here as the app grows
 */
export const appRouter = createTRPCRouter({
  activities: activitiesRouter,
  insights: insightsRouter,
  sync: syncRouter,
})

// Export type definition of API
export type AppRouter = typeof appRouter
