/**
 * tRPC Client Configuration
 *
 * This file sets up the tRPC client with React Query integration
 */

import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from './routers/_app'

/**
 * Create the tRPC React hooks
 */
export const trpc = createTRPCReact<AppRouter>()
