/**
 * Cloudflare Bypass Module
 *
 * Uses Playwright to automatically pass Cloudflare verification
 * and obtain valid cookies for API requests.
 */

import { chromium, type Browser, type BrowserContext } from 'playwright'

interface CookieCache {
  cookies: string
  userAgent: string
  expiresAt: number
}

// Reason: Cache cookies to avoid repeated browser launches
// Cloudflare cookies typically valid for 30 minutes
let cookieCache: CookieCache | null = null
const CACHE_DURATION_MS = 25 * 60 * 1000 // 25 minutes (safe margin)

/**
 * Check if cached cookies are still valid
 */
function isCacheValid(): boolean {
  if (!cookieCache) return false
  return Date.now() < cookieCache.expiresAt
}

/**
 * Pass Cloudflare verification and get cookies
 *
 * @param targetUrl The URL to verify against
 * @returns Object containing cookies string and user agent
 */
export async function getCloudflareCredentials(
  targetUrl: string,
): Promise<{ cookies: string; userAgent: string }> {
  // Return cached credentials if valid
  if (isCacheValid() && cookieCache) {
    console.log('[Cloudflare Bypass] Using cached credentials')
    return {
      cookies: cookieCache.cookies,
      userAgent: cookieCache.userAgent,
    }
  }

  console.log('[Cloudflare Bypass] Starting browser verification...')

  let browser: Browser | null = null
  let context: BrowserContext | null = null

  try {
    // Launch browser with realistic settings
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    })

    context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
    })

    const page = await context.newPage()

    // Navigate to target URL
    await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    // Wait for Cloudflare challenge to complete
    // Cloudflare typically redirects or shows content after verification
    await page
      .waitForFunction(
        () => {
          const html = document.documentElement.innerHTML
          // Check if still on challenge page
          const isChallenge =
            html.includes('challenge') ||
            html.includes('Checking your browser') ||
            html.includes('Just a moment')
          return !isChallenge
        },
        { timeout: 15000 },
      )
      .catch(() => {
        // Timeout is acceptable, cookies might still be set
        console.log('[Cloudflare Bypass] Challenge wait timeout, continuing...')
      })

    // Small delay to ensure cookies are set
    await page.waitForTimeout(2000)

    // Get all cookies
    const cookies = await context.cookies()
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

    // Cache the credentials
    cookieCache = {
      cookies: cookieString,
      userAgent,
      expiresAt: Date.now() + CACHE_DURATION_MS,
    }

    console.log('[Cloudflare Bypass] Verification complete, cookies cached')

    return { cookies: cookieString, userAgent }
  } catch (error) {
    console.error('[Cloudflare Bypass] Error:', error)
    throw new Error(
      `Failed to bypass Cloudflare: ${error instanceof Error ? error.message : String(error)}`,
    )
  } finally {
    if (context) await context.close()
    if (browser) await browser.close()
  }
}

/**
 * Clear cached credentials
 * Call this if API requests start failing
 */
export function clearCloudflareCache(): void {
  cookieCache = null
  console.log('[Cloudflare Bypass] Cache cleared')
}

/**
 * Make an HTTP request with Cloudflare bypass
 *
 * @param input Target URL or Request
 * @param init Fetch options
 * @returns Response from fetch
 */
export async function fetchWithCloudflareBypass(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  let url: string
  let options: RequestInit

  if (input instanceof Request) {
    url = input.url
    // Clone the request to avoid "ReadableStream is locked" error
    // Reason: Request body can only be read once, cloning creates a fresh copy
    const clonedRequest = input.clone()
    options = {
      method: clonedRequest.method,
      headers: clonedRequest.headers,
      body: clonedRequest.body,
      ...init,
    }
  } else {
    url = input.toString()
    options = init || {}
  }

  // Extract the actual API endpoint from complex URLs
  // e.g., "https://betterclau.de/claude/anyrouter.top/v1/messages" -> "https://anyrouter.top/v1/messages"
  const urlObj = new URL(url)
  let actualUrl = url
  let baseUrl = urlObj.origin

  // Handle nested proxy URLs like betterclau.de/claude/anyrouter.top
  const pathParts = urlObj.pathname.split('/')
  if (pathParts.length > 2 && pathParts[1] === 'claude') {
    // Extract the actual domain from path
    const actualDomain = pathParts[2]
    if (actualDomain && actualDomain.includes('.')) {
      baseUrl = `https://${actualDomain}`
      // Reconstruct the actual URL: domain + remaining path
      const remainingPath = '/' + pathParts.slice(3).join('/')
      actualUrl = `${baseUrl}${remainingPath}`
      console.log(`[Cloudflare Bypass] Detected nested proxy, redirecting to: ${actualUrl}`)
    }
  }

  const { cookies, userAgent } = await getCloudflareCredentials(baseUrl)

  const headers = new Headers(options.headers)
  headers.set('Cookie', cookies)
  headers.set('User-Agent', userAgent)

  const response = await fetch(actualUrl, {
    ...options,
    headers,
  })

  // If we get a challenge response, clear cache and retry once
  if (response.status === 403 || response.status === 503) {
    const text = await response.text()
    if (text.includes('challenge') || text.includes('<!DOCTYPE html>')) {
      console.log('[Cloudflare Bypass] Challenge detected, clearing cache and retrying...')
      clearCloudflareCache()

      const { cookies: newCookies, userAgent: newUserAgent } =
        await getCloudflareCredentials(baseUrl)

      headers.set('Cookie', newCookies)
      headers.set('User-Agent', newUserAgent)

      return fetch(actualUrl, {
        ...options,
        headers,
      })
    }
  }

  return response
}
