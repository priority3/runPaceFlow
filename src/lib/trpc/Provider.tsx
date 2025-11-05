/**
 * tRPC Provider
 *
 * This component wraps the app with tRPC and React Query providers
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'

import { trpc } from './client'

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '' // Browser should use relative URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}` // Vercel deployment
  }
  return `http://localhost:${process.env.PORT ?? 3000}` // Dev SSR
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000, // 5 seconds
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
