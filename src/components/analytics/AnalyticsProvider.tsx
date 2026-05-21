'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { trackPageView } from '@/lib/analytics/beacon'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname)
    }
  }, [pathname])

  return <>{children}</>
}
