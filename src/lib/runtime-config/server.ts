import { DEFAULT_PUBLIC_RUNTIME_CONFIG, normalizePublicRuntimeConfig } from './types'

const CACHE_TTL_MS = 1000

let settingsCache:
  | {
      fetchedAt: number
      settings: Record<string, string>
    }
  | undefined

function getAdminBaseUrl() {
  const configured = process.env.RUNPACEFLOW_ADMIN_URL || process.env.CONFIG_ADMIN_URL
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3030'
  return ''
}

function getExportToken() {
  return process.env.RUNPACEFLOW_CONFIG_EXPORT_TOKEN || process.env.CONFIG_EXPORT_TOKEN || ''
}

function parseEnvText(text: string) {
  const entries: Record<string, string> = {}

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const match = line.match(/^([A-Z_]\w*)=(.*)$/i)
    if (!match) continue

    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    entries[match[1]] = value
  }

  return entries
}

function readProcessSettings() {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

function mergeRuntimeSettings(
  processSettings: Record<string, string>,
  remoteSettings: Record<string, string> | null,
) {
  if (!remoteSettings) return processSettings

  const definedRemoteSettings = Object.fromEntries(
    Object.entries(remoteSettings).filter(([, value]) => value.trim() !== ''),
  )

  return {
    ...processSettings,
    ...definedRemoteSettings,
  }
}

async function fetchAdminSettings() {
  const adminBaseUrl = getAdminBaseUrl()
  const token = getExportToken()

  if (!adminBaseUrl || !token) return null

  const response = await fetch(`${adminBaseUrl}/api/settings/export?includeEmpty=1`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Config admin export failed: ${response.status}`)
  }

  return parseEnvText(await response.text())
}

export async function getRuntimeSettings({ force = false } = {}) {
  const now = Date.now()
  if (!force && settingsCache && now - settingsCache.fetchedAt < CACHE_TTL_MS) {
    return settingsCache.settings
  }

  let remoteSettings: Record<string, string> | null = null
  try {
    remoteSettings = await fetchAdminSettings()
  } catch (error) {
    console.warn('[runtime-config] Falling back to process.env:', (error as Error).message)
  }

  const settings = mergeRuntimeSettings(readProcessSettings(), remoteSettings)

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
  const settings = await getRuntimeSettings({ force })
  return normalizePublicRuntimeConfig(settings, new Date().toISOString())
}

export function getFallbackPublicRuntimeConfig() {
  return DEFAULT_PUBLIC_RUNTIME_CONFIG
}
