/**
 * tRPC Server Configuration
 *
 * This file sets up the tRPC server context and procedures
 * for the Next.js App Router.
 */

import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

/** Admin owns the database connection; the main site tRPC context is intentionally empty. */
export const createTRPCContext = async () => ({})

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

/**
 * Initialize tRPC with the context
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

/**
 * Export reusable router and procedure helpers
 */
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
