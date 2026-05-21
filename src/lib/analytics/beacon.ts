/**
 * Analytics Beacon
 *
 * Sends page view data to RunPaceFlow Admin for analytics tracking.
 * Uses sendBeacon for reliable delivery without blocking navigation.
 * Tracks page load time and scroll depth for richer analytics.
 * Supports A/B testing with variant assignment and tracking.
 */

const VISITOR_KEY = 'rpf_visitor_id'
const SESSION_KEY = 'rpf_session_id'
const AB_VARIANT_KEY = 'rpf_ab_variants'

let cachedAdminUrl: string | null = null
let pageLoadTime: number | null = null
let maxScrollDepth = 0
let clickBuffer: Array<{ x: number; y: number; selector: string; timestamp: number }> = []
const CLICK_BUFFER_SIZE = 10
const CLICK_FLUSH_INTERVAL = 5000

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

function getSelector(el: Element): string {
  if (el.id) return `#${el.id}`
  if (el.className && typeof el.className === 'string') {
    const classes = el.className
      .split(/\s+/)
      .filter((c) => c && !c.startsWith('tw-'))
      .slice(0, 2)
      .join('.')
    if (classes) return `${el.tagName.toLowerCase()}.${classes}`
  }
  return el.tagName.toLowerCase()
}

function flushClickBuffer() {
  if (clickBuffer.length === 0 || !cachedAdminUrl) return

  const clicks = [...clickBuffer]
  clickBuffer = []

  const data = {
    type: 'clicks',
    clicks,
    path: window.location.pathname,
    visitorId: getOrCreateVisitorId(),
  }

  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    navigator.sendBeacon(`${cachedAdminUrl}/api/analytics/track`, blob)
  }
}

function trackClicks() {
  if (typeof window === 'undefined') return

  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as Element
      if (!target) return

      // Find closest meaningful element
      const el = target.closest('a, button, [role="button"], input[type="submit"]') || target
      const selector = getSelector(el)

      clickBuffer.push({
        x: Math.round((e.clientX / window.innerWidth) * 100),
        y: Math.round((e.clientY / window.innerHeight) * 100),
        selector,
        timestamp: Date.now(),
      })

      if (clickBuffer.length >= CLICK_BUFFER_SIZE) {
        flushClickBuffer()
      }
    },
    { passive: true },
  )

  // Flush periodically
  setInterval(flushClickBuffer, CLICK_FLUSH_INTERVAL)

  // Flush on page unload
  window.addEventListener('beforeunload', flushClickBuffer)
}

// Initialize tracking on module load
if (typeof window !== 'undefined') {
  trackScrollDepth()
  trackPageLoad()
  trackClicks()
  trackErrors()
}

// ─── Error Tracking ──────────────────────────────────────────────────────────

function trackErrors() {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (event) => {
    const adminUrl = cachedAdminUrl
    if (!adminUrl) return

    const data = {
      type: 'error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack?.slice(0, 500),
      path: window.location.pathname,
      visitorId: getOrCreateVisitorId(),
    }

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      navigator.sendBeacon(`${adminUrl}/api/analytics/track`, blob)
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    const adminUrl = cachedAdminUrl
    if (!adminUrl) return

    const data = {
      type: 'error',
      message: `Unhandled Promise: ${event.reason}`,
      path: window.location.pathname,
      visitorId: getOrCreateVisitorId(),
    }

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      navigator.sendBeacon(`${adminUrl}/api/analytics/track`, blob)
    }
  })
}

// ─── A/B Testing Support ─────────────────────────────────────────────────────

interface ABVariant {
  testName: string
  variant: string
  assignedAt: number
}

function getStoredVariants(): Record<string, ABVariant> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(AB_VARIANT_KEY) || '{}')
  } catch {
    return {}
  }
}

function storeVariant(testName: string, variant: string) {
  if (typeof window === 'undefined') return
  const variants = getStoredVariants()
  variants[testName] = { testName, variant, assignedAt: Date.now() }
  localStorage.setItem(AB_VARIANT_KEY, JSON.stringify(variants))
}

/**
 * Get or assign a variant for an A/B test.
 * Uses deterministic assignment based on visitor ID for consistency.
 *
 * @param testName - Unique test identifier
 * @param variants - Array of variant names (e.g., ['control', 'variant-a'])
 * @returns The assigned variant name
 */
export function getABVariant(testName: string, variants: string[]): string {
  if (typeof window === 'undefined' || variants.length === 0) return variants[0] || ''

  const stored = getStoredVariants()
  if (stored[testName]) return stored[testName].variant

  // Deterministic assignment based on visitor ID
  const visitorId = getOrCreateVisitorId()
  let hash = 0
  const seed = `${visitorId}:${testName}`
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  const index = Math.abs(hash) % variants.length
  const variant = variants[index]

  storeVariant(testName, variant)
  return variant
}

/**
 * Track an A/B test conversion event.
 */
export function trackConversion(testName: string, goal: string) {
  const stored = getStoredVariants()
  const variant = stored[testName]?.variant
  if (!variant) return

  const adminUrl = cachedAdminUrl
  if (!adminUrl) return

  const data = {
    type: 'conversion',
    testName,
    variant,
    goal,
    visitorId: getOrCreateVisitorId(),
    sessionId: getOrCreateSessionId(),
  }

  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    navigator.sendBeacon(`${adminUrl}/api/analytics/track`, blob)
  }
}

/**
 * Get all active A/B test variants for the current visitor.
 */
export function getActiveABTests(): Record<string, string> {
  const stored = getStoredVariants()
  const result: Record<string, string> = {}
  for (const [testName, data] of Object.entries(stored)) {
    result[testName] = data.variant
  }
  return result
}

// ─── Page View Tracking ──────────────────────────────────────────────────────

export async function trackPageView(path: string) {
  const adminUrl = await getAdminUrl()
  if (!adminUrl) return

  const abTests = getActiveABTests()

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
    abTests: Object.keys(abTests).length > 0 ? abTests : undefined,
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
