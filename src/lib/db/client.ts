import path from 'node:path'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import { getRuntimeSettings } from '@/lib/runtime-config/server'

import * as schema from './schema'

/**
 * 数据库配置
 * 默认使用 data/activities.db，支持 Git 持久化
 * 可通过 DATABASE_URL 环境变量覆盖
 */
const getDatabaseUrl = (settings: Record<string, string>) => {
  if (settings.DATABASE_URL) {
    return settings.DATABASE_URL
  }

  // 在 Vercel 环境中，使用绝对路径
  if (process.env.VERCEL) {
    // Vercel 会将项目文件部署到 /var/task
    return `file:${path.join(process.cwd(), 'data', 'activities.db')}`
  }

  // 本地开发环境
  return 'file:./data/activities.db'
}

type DbInstance = ReturnType<typeof drizzle<typeof schema>>

let cachedDb:
  | {
      db: DbInstance
      signature: string
    }
  | undefined

export async function getDb() {
  const settings = await getRuntimeSettings()
  const url = getDatabaseUrl(settings)
  const authToken = settings.DATABASE_AUTH_TOKEN
  const signature = `${url}\n${authToken ?? ''}`

  if (!cachedDb || cachedDb.signature !== signature) {
    const client = createClient({ url, authToken })
    cachedDb = {
      db: drizzle(client, { schema }),
      signature,
    }
  }

  return cachedDb.db
}
