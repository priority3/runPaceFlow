/**
 * tRPC Server Configuration
 *
 * This file sets up the tRPC server context and procedures
 * for the Next.js App Router.
 */

import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

import { db } from '@/lib/db'

/**
 * Create the tRPC context
 * This is where we add things that should be available to all procedures
 * like the database instance
 */
export const createTRPCContext = async () => {
  return {
    db,
  }
}

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
