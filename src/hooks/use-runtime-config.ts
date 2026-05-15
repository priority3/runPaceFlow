'use client'

import { useEffect, useState } from 'react'

import type { PublicRuntimeConfig } from '@/lib/runtime-config/types'
import { DEFAULT_PUBLIC_RUNTIME_CONFIG } from '@/lib/runtime-config/types'

export function useRuntimeConfig() {
  const [config, setConfig] = useState<PublicRuntimeConfig>(DEFAULT_PUBLIC_RUNTIME_CONFIG)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch('/api/runtime-config', { cache: 'no-store' })
        if (!response.ok) return
        const nextConfig = (await response.json()) as PublicRuntimeConfig
        if (!cancelled) {
          setConfig(nextConfig)
        }
      } catch {
        // Keep fallback config when runtime config is temporarily unavailable.
      }
    }

    void load()

    const source = new EventSource('/api/runtime-config/stream')
    source.addEventListener('runtime-config', (event) => {
      try {
        setConfig(JSON.parse(event.data) as PublicRuntimeConfig)
      } catch {
        // Ignore malformed events and keep the last known good config.
      }
    })

    return () => {
      cancelled = true
      source.close()
    }
  }, [])

  return config
}
