import { z } from 'zod'

import type { PublicRuntimeConfig } from '@/lib/runtime-config/types'

const DEFAULT_ADMIN_URL = 'http://localhost:3030'
const REQUEST_TIMEOUT_MS = 8_000

const publicRuntimeConfigSchema = z.object({
  goals: z.object({
    running: z.object({
      weeklyDistance: z.number(),
      monthlyDistance: z.number(),
      weeklyDuration: z.number(),
      monthlyDuration: z.number(),
    }),
    cycling: z.object({
      weeklyDistance: z.number(),
      monthlyDistance: z.number(),
      weeklyDuration: z.number(),
      monthlyDuration: z.number(),
    }),
  }),
  mapStyle: z.string(),
  adminUrl: z.string(),
  updatedAt: z.string().nullable(),
})

function getAdminBaseUrl() {
  const configured = process.env.RUNPACEFLOW_ADMIN_URL || process.env.CONFIG_ADMIN_URL
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.NODE_ENV !== 'production') return DEFAULT_ADMIN_URL
  return ''
}

function getAdminToken() {
  return process.env.RUNPACEFLOW_ADMIN_API_TOKEN || process.env.MAIN_SITE_API_TOKEN || ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (isRecord(payload) && typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error
  }
  return fallback
}

const DATE_KEYS = new Set(['startTime', 'endTime', 'createdAt', 'updatedAt', 'generatedAt'])

function reviveDates(value: unknown, key?: string): unknown {
  if (typeof value === 'string' && key && DATE_KEYS.has(key)) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      throw new TypeError(`Admin API returned invalid ${key}`)
    }
    return date
  }
  if (Array.isArray(value)) return value.map((item) => reviveDates(item))
  if (!isRecord(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      reviveDates(entryValue, entryKey),
    ]),
  )
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error(`Admin API returned invalid JSON (${response.status})`)
  }
}

function getRequestUrl(path: string) {
  const baseUrl = getAdminBaseUrl()
  if (!baseUrl) {
    throw new Error('RunPaceFlow Admin URL is not configured')
  }
  return `${baseUrl}${path}`
}

async function fetchAdmin(path: string, init: RequestInit = {}) {
  const token = getAdminToken()
  if (!token) {
    throw new Error('RunPaceFlow Admin API token is not configured')
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Accept', 'application/json')
  const response = await fetch(getRequestUrl(path), {
    ...init,
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const payload = await parseJson(response)
  if (!response.ok) {
    throw new Error(`[admin ${path}] ${readErrorMessage(payload, `HTTP ${response.status}`)}`)
  }
  return payload
}

export async function queryAdmin<T>(operation: string, input: unknown): Promise<T> {
  const payload = await fetchAdmin('/api/main-site/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, input }),
  })
  if (!isRecord(payload) || !('data' in payload)) {
    throw new Error(`[admin ${operation}] response is missing data`)
  }
  return reviveDates(payload.data) as T
}

export async function fetchAdminPublicConfig(): Promise<PublicRuntimeConfig | null> {
  if (!getAdminBaseUrl() || !getAdminToken()) return null
  const payload = await fetchAdmin('/api/main-site/config')
  const parsed = publicRuntimeConfigSchema.safeParse(payload)
  if (!parsed.success) throw new Error('[admin config] response has invalid shape')
  return parsed.data
}
