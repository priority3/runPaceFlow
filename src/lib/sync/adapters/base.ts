/**
 * 数据同步适配器基础接口
 * 用于统一不同数据源（Nike, Strava, Garmin）的数据格式
 */
export interface SyncAdapter {
  /** 适配器名称 */
  name: string

  /**
   * 认证
   * @param credentials 认证凭证
   * @returns 认证是否成功
   */
  authenticate: (credentials: Record<string, any>) => Promise<boolean>

  /**
   * 获取活动列表
   * @param options 查询选项
   * @returns 原始活动数据列表
   */
  getActivities: (options?: {
    startDate?: Date
    endDate?: Date
    limit?: number
  }) => Promise<RawActivity[]>

  /**
   * 获取单个活动详情（包含 GPX 数据）
   * @param id 活动 ID
   * @returns 原始活动数据
   */
  getActivityDetail: (id: string) => Promise<RawActivity>

  /**
   * 下载 GPX 文件
   * @param activityId 活动 ID
   * @returns GPX XML 字符串
   */
  downloadGPX: (activityId: string) => Promise<string>

  /**
   * 健康检查
   * @returns 服务是否可用
   */
  healthCheck: () => Promise<boolean>
}

/**
 * 原始活动数据（统一格式）
 */
export interface RawActivity {
  /** 活动 ID */
  id: string
  /** 活动标题 */
  title: string
  /** 活动类型 */
  type: 'running' | 'cycling' | 'walking' | 'swimming' | 'other'
  /** 开始时间 */
  startTime: Date
  /** 持续时间（秒） */
  duration: number
  /** 距离（米） */
  distance: number
  /** GPX 数据（可选） */
  gpxData?: string
  /** 平均配速（秒/公里）（可选） */
  averagePace?: number
  /** 最快配速（秒/公里）（可选） */
  bestPace?: number
  /** 海拔上升（米）（可选） */
  elevationGain?: number
  /** 平均心率（可选） */
  averageHeartRate?: number
  /** 最大心率（可选） */
  maxHeartRate?: number
  /** 卡路里（可选） */
  calories?: number
  /** 数据来源 */
  source: string
}

/**
 * 适配器工厂函数已移至 service.ts
 * 各适配器可通过以下方式导入：
 * - import { NikeAdapter } from './adapters/nike'
 * - import { StravaAdapter } from './adapters/strava' (待实现)
 * - import { GarminAdapter } from './adapters/garmin' (待实现)
 */
