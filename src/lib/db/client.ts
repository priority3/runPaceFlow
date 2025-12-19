import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from './schema'

/**
 * 数据库配置
 * 默认使用 data/activities.db，支持 Git 持久化
 * 可通过 DATABASE_URL 环境变量覆盖
 */
const client = createClient({
  url: process.env.DATABASE_URL ?? 'file:./data/activities.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

/**
 * Drizzle ORM 实例
 */
export const db = drizzle(client, { schema })
