import path from 'node:path'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from './schema'

/**
 * 数据库配置
 * 默认使用 data/activities.db，支持 Git 持久化
 * 可通过 DATABASE_URL 环境变量覆盖
 */
const getDatabaseUrl = () => {
  // 如果有环境变量，直接使用
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // 在 Vercel 环境中，使用绝对路径
  if (process.env.VERCEL) {
    // Vercel 会将项目文件部署到 /var/task
    return `file:${path.join(process.cwd(), 'data', 'activities.db')}`
  }

  // 本地开发环境
  return 'file:./data/activities.db'
}

const client = createClient({
  url: getDatabaseUrl(),
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

/**
 * Drizzle ORM 实例
 */
export const db = drizzle(client, { schema })
