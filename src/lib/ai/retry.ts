/**
 * Retry Mechanism for Claude API
 *
 * Implements exponential backoff and request queuing to avoid rate limits
 */

interface RetryOptions {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableStatusCodes: number[]
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504],
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const exponentialDelay = Math.min(
    options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt),
    options.maxDelayMs,
  )
  // Add jitter (±25%) to avoid thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1)
  return Math.floor(exponentialDelay + jitter)
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown, options: RetryOptions): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Check for rate limit messages
    if (
      message.includes('rate limit') ||
      message.includes('负载已经达到上限') ||
      message.includes('too many requests') ||
      message.includes('请稍后重试')
    ) {
      return true
    }

    // Check for status codes in error message
    for (const code of options.retryableStatusCodes) {
      if (message.includes(`${code}`)) {
        return true
      }
    }

    // Check for temporary network errors
    if (
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('network')
    ) {
      return true
    }
  }

  return false
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if not retryable or last attempt
      if (!isRetryableError(error, opts) || attempt === opts.maxRetries) {
        throw error
      }

      const delay = calculateDelay(attempt, opts)
      console.log(
        `[Retry] Attempt ${attempt + 1}/${opts.maxRetries} failed, retrying in ${delay}ms...`,
        error instanceof Error ? error.message : String(error),
      )

      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Request Queue to prevent concurrent API calls
 */
class RequestQueue {
  private queue: Array<() => void> = []
  private processing = false
  private lastRequestTime = 0
  private minRequestInterval = 3000 // Minimum 3 seconds between requests (increased for overloaded proxy)

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Ensure minimum interval between requests
          const now = Date.now()
          const timeSinceLastRequest = now - this.lastRequestTime
          if (timeSinceLastRequest < this.minRequestInterval) {
            await sleep(this.minRequestInterval - timeSinceLastRequest)
          }

          this.lastRequestTime = Date.now()
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const task = this.queue.shift()
      if (task) {
        await task()
      }
    }

    this.processing = false
  }
}

// Global request queue instance
const globalRequestQueue = new RequestQueue()

/**
 * Execute function with request queuing
 */
export async function withRequestQueue<T>(fn: () => Promise<T>): Promise<T> {
  return globalRequestQueue.enqueue(fn)
}
