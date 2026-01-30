import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * 活动表 - 存储跑步活动的核心信息
 */
export const activities = sqliteTable('activities', {
  // 主键和基本信息
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'running' | 'cycling' | 'walking'
  source: text('source').notNull(), // 'nike' | 'strava' | 'garmin'
  sourceId: text('source_id').notNull(), // 原始平台的 ID

  // 时间信息
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  duration: integer('duration').notNull(), // 秒

  // 距离和配速
  distance: real('distance').notNull(), // 米
  averagePace: real('average_pace'), // 秒/公里
  bestPace: real('best_pace'), // 秒/公里

  // 其他数据
  elevationGain: real('elevation_gain'), // 米
  averageHeartRate: integer('average_heart_rate'),
  maxHeartRate: integer('max_heart_rate'),
  calories: integer('calories'),

  // GPX 数据
  gpxData: text('gpx_data'), // 完整的 GPX XML

  // 室内/户外标识
  isIndoor: integer('is_indoor', { mode: 'boolean' }).default(false), // true = 室内（跑步机等）

  // 时间戳
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

/**
 * 分段数据表 - 存储每公里的详细数据
 */
export const splits = sqliteTable('splits', {
  id: text('id').primaryKey(),
  activityId: text('activity_id')
    .notNull()
    .references(() => activities.id, { onDelete: 'cascade' }),

  kilometer: integer('kilometer').notNull(), // 第几公里
  duration: integer('duration').notNull(), // 该公里用时（秒）
  pace: real('pace').notNull(), // 配速（秒/公里）
  distance: real('distance').notNull(), // 实际距离（米）
  elevationGain: real('elevation_gain'), // 海拔上升（米）
  averageHeartRate: integer('average_heart_rate'),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

/**
 * 用户配置表 - 存储用户信息和同步配置（单用户系统）
 */
export const userProfile = sqliteTable('user_profile', {
  id: text('id').primaryKey(),
  name: text('name'),
  avatar: text('avatar'),

  // 同步配置
  syncSource: text('sync_source'), // 'nike' | 'strava' | 'garmin'
  nikeAccessToken: text('nike_access_token'),
  stravaAccessToken: text('strava_access_token'),
  garminSecretString: text('garmin_secret_string'),

  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

/**
 * 同步日志表 - 记录每次数据同步的结果
 */
export const syncLogs = sqliteTable('sync_logs', {
  id: text('id').primaryKey(),
  source: text('source').notNull(), // 'nike' | 'strava' | 'garmin'
  status: text('status').notNull(), // 'success' | 'failed' | 'running'
  activitiesCount: integer('activities_count'),
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})

/**
 * AI 洞察表 - 缓存 Claude 生成的跑步分析
 */
export const activityInsights = sqliteTable('activity_insights', {
  id: text('id').primaryKey(),
  activityId: text('activity_id')
    .notNull()
    .references(() => activities.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull(),
  model: text('model').notNull(), // e.g., 'claude-sonnet-4-20250514'
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// 导出类型
export type Activity = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert

export type Split = typeof splits.$inferSelect
export type NewSplit = typeof splits.$inferInsert

export type UserProfile = typeof userProfile.$inferSelect
export type NewUserProfile = typeof userProfile.$inferInsert

export type SyncLog = typeof syncLogs.$inferSelect
export type NewSyncLog = typeof syncLogs.$inferInsert

export type ActivityInsight = typeof activityInsights.$inferSelect
export type NewActivityInsight = typeof activityInsights.$inferInsert
