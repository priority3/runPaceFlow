#!/usr/bin/env bun

import { env, exit } from 'node:process'

/**
 * Inspect the activity count exposed by RunPaceFlow Admin.
 * Usage: RUNPACEFLOW_ADMIN_API_TOKEN=... bun run scripts/check-admin-data.ts
 */

const adminUrl = (env.RUNPACEFLOW_ADMIN_URL || 'http://127.0.0.1:3030').replace(/\/$/, '')
const token = env.RUNPACEFLOW_ADMIN_API_TOKEN || ''

if (!token) {
  console.error('RUNPACEFLOW_ADMIN_API_TOKEN not set')
  exit(1)
}

const response = await fetch(`${adminUrl}/api/main-site/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ operation: 'activities.list', input: { limit: 5 } }),
})

const payload = await response.json()
if (!response.ok) {
  console.error(`Admin API returned HTTP ${response.status}`)
  exit(1)
}

const activities = payload?.data?.activities
console.info(`Admin URL: ${adminUrl}`)
console.info(`Total activities: ${payload?.data?.pagination?.total ?? 0}`)
for (const activity of Array.isArray(activities) ? activities : []) {
  console.info(`  ${activity.startTime} | ${activity.title} | source: ${activity.source}`)
}
