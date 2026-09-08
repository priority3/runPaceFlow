import { fetchAdminPublicConfig } from '@/lib/admin-api'

import { DEFAULT_PUBLIC_RUNTIME_CONFIG, normalizePublicRuntimeConfig } from './types'

const CACHE_TTL_MS = 1000

let settingsCache:
  | {
      fetchedAt: number
      settings: Record<string, string>
    }
  | undefined

function readProcessSettings() {
  const blockedKeys = new Set([
    'DATABASE_URL',
    'DATABASE_AUTH_TOKEN',
    'ACTIVITIES_DATABASE_URL',
    'ACTIVITIES_DATABASE_AUTH_TOKEN',
  ])
  return Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === 'string' && !blockedKeys.has(entry[0]),
    ),
  )
}

export async function getRuntimeSettings({ force = false } = {}) {
  const now = Date.now()
  if (!force && settingsCache && now - settingsCache.fetchedAt < CACHE_TTL_MS) {
    return settingsCache.settings
  }

  // Secret runtime settings stay in their owning service. The main site only
  // fetches the explicit public config allowlist below.
  const settings = readProcessSettings()

  settingsCache = {
    fetchedAt: now,
    settings,
  }

  return settings
}

export async function getRuntimeSetting(key: string) {
  const settings = await getRuntimeSettings()
  return settings[key] ?? ''
}

export async function getPublicRuntimeConfig({ force = false } = {}) {
  try {
    const remoteConfig = await fetchAdminPublicConfig()
    if (remoteConfig) {
      return {
        ...remoteConfig,
        // The public admin URL is owned by the main-site deployment because
        // the browser sends analytics beacons back to this endpoint.
        adminUrl: remoteConfig.adminUrl || process.env.NEXT_PUBLIC_ADMIN_URL || '',
      }
    }
  } catch (error) {
    console.warn(
      '[runtime-config] Falling back to local public defaults:',
      (error as Error).message,
    )
  }

  const settings = await getRuntimeSettings({ force })
  return normalizePublicRuntimeConfig(settings, new Date().toISOString())
}

export function getFallbackPublicRuntimeConfig() {
  return DEFAULT_PUBLIC_RUNTIME_CONFIG
}
