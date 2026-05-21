/**
 * Analytics Beacon
 *
 * Sends page view data to RunPaceFlow Admin for analytics tracking.
 * Uses sendBeacon for reliable delivery without blocking navigation.
 * Tracks page load time and scroll depth for richer analytics.
 */

const VISITOR_KEY = 'rpf_visitor_id'
const SESSION_KEY = 'rpf_session_id'

let cachedAdminUrl: string | null = null
let pageLoadTime: number | null = null
let maxScrollDepth = 0

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

async function getAdminUrl(): Promise<string> {
  if (cachedAdminUrl !== null) return cachedAdminUrl

  try {
    const res = await fetch('/api/runtime-config', { cache: 'no-store' })
    const config = await res.json()
    cachedAdminUrl = config?.adminUrl || ''
  } catch {
    cachedAdminUrl = ''
  }

  return cachedAdminUrl ?? ''
}

function trackScrollDepth() {
  if (typeof window === 'undefined') return

  const updateMaxScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const scrollHeight =
      document.documentElement.scrollHeight - document.documentElement.clientHeight
    if (scrollHeight > 0) {
      const depth = Math.round((scrollTop / scrollHeight) * 100)
      if (depth > maxScrollDepth) {
        maxScrollDepth = depth
      }
    }
  }

  window.addEventListener('scroll', updateMaxScroll, { passive: true })
  return () => window.removeEventListener('scroll', updateMaxScroll)
}

function trackPageLoad() {
  if (typeof window === 'undefined') return

  const measure = () => {
    const perfEntries = performance.getEntriesByType('navigation')
    if (perfEntries.length > 0) {
      const nav = perfEntries[0] as PerformanceNavigationTiming
      pageLoadTime = Math.round(nav.loadEventEnd - nav.startTime)
    }
  }

  if (document.readyState === 'complete') {
    measure()
  } else {
    window.addEventListener('load', measure, { once: true })
  }
}

// Initialize tracking on module load
if (typeof window !== 'undefined') {
  trackScrollDepth()
  trackPageLoad()
}

export async function trackPageView(path: string) {
  const adminUrl = await getAdminUrl()
  if (!adminUrl) return

  const data = {
    path,
    referrer: document.referrer || undefined,
    visitorId: getOrCreateVisitorId(),
    sessionId: getOrCreateSessionId(),
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    loadTime: pageLoadTime,
    scrollDepth: maxScrollDepth,
  }

  // Reset scroll depth for next page
  maxScrollDepth = 0
  pageLoadTime = null

  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    navigator.sendBeacon(`${adminUrl}/api/analytics/track`, blob)
  } else {
    fetch(`${adminUrl}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {})
  }
}
