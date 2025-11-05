import type { RawActivity, SyncAdapter } from './base'

/**
 * Nike Run Club 适配器
 * 用于同步 Nike Run Club 的跑步数据
 */
export class NikeAdapter implements SyncAdapter {
  name = 'nike'
  // @ts-expect-error - 将在实际 Nike API 集成时使用
  private _accessToken: string

  constructor(accessToken: string) {
    this._accessToken = accessToken
  }

  /**
   * 认证
   */
  async authenticate(_credentials: { accessToken: string }): Promise<boolean> {
    try {
      await this.healthCheck()
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取活动列表
   */
  async getActivities(
    _options: {
      startDate?: Date
      endDate?: Date
      limit?: number
    } = {},
  ): Promise<RawActivity[]> {
    // TODO: 替换为实际的 Nike API 端点
    // const apiUrl = 'https://api.nike.com/sport/v3/me/activities'

    // 示例：调用 Nike API
    // const response = await fetch(apiUrl, {
    //   headers: {
    //     'Authorization': `Bearer ${this.accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    // })

    // if (!response.ok) {
    //   throw new Error(`Nike API error: ${response.statusText}`)
    // }

    // const data = await response.json()
    // return data.activities.map(this.transformActivity)

    // 临时返回空数组（等待实际 API 集成）
    console.warn('Nike adapter: getActivities not implemented yet')
    return []
  }

  /**
   * 获取活动详情
   */
  async getActivityDetail(_id: string): Promise<RawActivity> {
    // TODO: 替换为实际的 Nike API 端点
    // const apiUrl = `https://api.nike.com/sport/v3/me/activity/${id}`

    // const response = await fetch(apiUrl, {
    //   headers: {
    //     'Authorization': `Bearer ${this.accessToken}`,
    //   },
    // })

    // if (!response.ok) {
    //   throw new Error(`Nike API error: ${response.statusText}`)
    // }

    // const data = await response.json()
    // const gpxData = await this.downloadGPX(id)

    // return this.transformActivity(data, gpxData)

    throw new Error('Nike adapter: getActivityDetail not implemented yet')
  }

  /**
   * 下载 GPX 文件
   */
  async downloadGPX(_activityId: string): Promise<string> {
    // TODO: 替换为实际的 Nike GPX 下载端点
    // const apiUrl = `https://api.nike.com/sport/v3/me/activity/${activityId}/gps`

    // const response = await fetch(apiUrl, {
    //   headers: {
    //     'Authorization': `Bearer ${this.accessToken}`,
    //   },
    // })

    // if (!response.ok) {
    //   throw new Error(`Nike API error: ${response.statusText}`)
    // }

    // return await response.text()

    throw new Error('Nike adapter: downloadGPX not implemented yet')
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    // TODO: 替换为实际的 Nike API 健康检查端点
    // try {
    //   const response = await fetch('https://api.nike.com/sport/v3/me', {
    //     headers: {
    //       'Authorization': `Bearer ${this.accessToken}`,
    //     },
    //   })
    //   return response.ok
    // } catch {
    //   return false
    // }

    // 临时返回 true（等待实际 API 集成）
    return true
  }

  /**
   * 转换 Nike 数据格式到统一格式
   */
  // @ts-expect-error - 将在实际 Nike API 集成时使用
  private _transformActivity(raw: any, gpxData?: string): RawActivity {
    // TODO: 根据实际的 Nike API 响应格式进行转换
    return {
      id: raw.id,
      title: raw.name || '跑步',
      type: this.mapActivityType(raw.type),
      startTime: new Date(raw.start_epoch_ms),
      duration: Math.floor(raw.active_duration_ms / 1000), // 转换为秒
      distance: raw.distance || 0, // Nike 返回的可能是米
      gpxData,
      averagePace: raw.average_pace,
      bestPace: raw.best_pace,
      elevationGain: raw.elevation_gain,
      averageHeartRate: raw.average_heart_rate,
      maxHeartRate: raw.max_heart_rate,
      calories: raw.calories,
      source: 'nike',
    }
  }

  /**
   * 映射活动类型
   */
  private mapActivityType(nikeType: string): 'running' | 'cycling' | 'walking' {
    const type = nikeType?.toLowerCase()
    if (type?.includes('run')) return 'running'
    if (type?.includes('cycle') || type?.includes('bike')) return 'cycling'
    if (type?.includes('walk')) return 'walking'
    return 'running' // 默认为跑步
  }
}
