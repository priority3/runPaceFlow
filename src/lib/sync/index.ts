/**
 * 数据同步模块
 * 统一导出所有同步相关的功能
 */

// 同步服务
export type { SyncOptions, SyncResult, SyncSource } from './service'
export { getSyncHistory, performSync, testConnection } from './service'

// 数据处理
export { deleteActivity, syncActivities, syncActivity } from './processor'

// 适配器
export type { RawActivity, SyncAdapter } from './adapters/base'
export { NikeAdapter } from './adapters/nike'

// GPX 解析
export type { GPXData, GPXPoint, GPXTrack } from './parser'
export { calculateDistance, calculateElevationGain, calculateTrackDistance, parseGPX, simplifyTrack } from './parser'
