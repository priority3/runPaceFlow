import type { RawActivity, SyncAdapter } from './base'

/**
 * Nike API 配置
 */
const NIKE_API_BASE = 'https://api.nike.com/plus/v3'
const NIKE_TOKEN_REFRESH_URL = 'https://api.nike.com/idn/shim/oauth/2.0/token'

/**
 * Nike Run Club 适配器
 * 用于同步 Nike Run Club 的跑步数据
 */
export class NikeAdapter implements SyncAdapter {
  name = 'nike'
  private accessToken: string
  private refreshToken?: string

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }

  /**
   * 认证
   */
  async authenticate(credentials: Record<string, any>): Promise<boolean> {
    try {
      // Validate credentials
      if (!credentials.accessToken) {
        return false
      }
      await this.healthCheck()
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取活动列表（支持分页和增量同步）
   * 使用 before_id 参数实现分页
   * @param options.after - Unix timestamp for incremental sync (optional)
   */
  async getActivities(
    options: {
      startDate?: Date
      endDate?: Date
      after?: number
      limit?: number
      beforeId?: string // 分页标识
    } = {},
  ): Promise<RawActivity[]> {
    const activities: RawActivity[] = []
    let beforeId = options.beforeId || null
    const pageLimit = options.limit || 30

    // Convert after timestamp to Date for comparison
    const afterDate = options.after ? new Date(options.after * 1000) : null

    try {
      // 分页获取活动列表
      while (true) {
        const data = await this.getActivitiesPage(beforeId, pageLimit)

        if (!data.activities || data.activities.length === 0) {
          break
        }

        // 过滤 NTC (Nike Training Club) 记录
        const runActivities = data.activities.filter((activity: any) => {
          const appId = activity.app_id || ''
          return !appId.includes('ntc') // 排除 NTC 训练记录
        })

        // 获取每个活动的详情
        for (const activity of runActivities) {
          // Skip activities older than the after timestamp (incremental sync)
          if (afterDate && activity.start_epoch_ms) {
            const activityDate = new Date(activity.start_epoch_ms)
            if (activityDate <= afterDate) {
              // Activities are returned in reverse chronological order
              // Once we hit an old activity, we can stop
              console.info(`⏭️ Skipping activity ${activity.id} (older than last sync)`)
              return activities
            }
          }

          try {
            const detail = await this.getActivityDetail(activity.id)
            activities.push(detail)
          } catch (error) {
            console.error(`Failed to fetch activity ${activity.id}:`, error)
          }
        }

        // 检查是否有下一页
        beforeId = data.paging?.before_id || null
        if (!beforeId) {
          break
        }

        // 如果设置了 limit，检查是否已经达到
        if (options.limit && activities.length >= options.limit) {
          break
        }
      }

      return activities
    } catch (error) {
      console.error('Failed to fetch Nike activities:', error)
      throw error
    }
  }

  /**
   * 获取单页活动列表
   */
  private async getActivitiesPage(
    beforeId: string | null,
    limit: number,
  ): Promise<{ activities: any[]; paging?: { before_id: string | null } }> {
    const endpoint = beforeId ? `activities/before_id/v3/${beforeId}` : `activities/before_id/v3/0` // 初始请求使用 0

    const url = `${NIKE_API_BASE}/${endpoint}?limit=${limit}&types=run%2Cjogging&include_deleted=false`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // 尝试刷新 token
      if (response.status === 401 && this.refreshToken) {
        await this.refreshAccessToken()
        // 重试请求
        return this.getActivitiesPage(beforeId, limit)
      }
      throw new Error(`Nike API error: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 获取活动详情
   */
  async getActivityDetail(id: string): Promise<RawActivity> {
    const url = `${NIKE_API_BASE}/activity/${id}?metrics=ALL`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // 尝试刷新 token
      if (response.status === 401 && this.refreshToken) {
        await this.refreshAccessToken()
        // 重试请求
        return this.getActivityDetail(id)
      }
      throw new Error(`Nike API error: ${response.statusText}`)
    }

    const data = await response.json()

    // 从 metrics 生成 GPX
    const gpxData = await this.generateGPXFromMetrics(data)

    return this.transformActivity(data, gpxData)
  }

  /**
   * 下载/生成 GPX 文件
   * Nike 没有提供 GPX 下载端点，需要从 metrics 数据生成
   */
  async downloadGPX(activityId: string): Promise<string> {
    // 获取活动详情（包含 metrics）
    const url = `${NIKE_API_BASE}/activity/${activityId}?metrics=ALL`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Nike API error: ${response.statusText}`)
    }

    const data = await response.json()
    return this.generateGPXFromMetrics(data)
  }

  /**
   * 从 Nike metrics 数据生成 GPX XML
   * Reason: Nike API 返回的是 metrics 数组，需要转换为 GPX 格式
   */
  private async generateGPXFromMetrics(activity: any): Promise<string> {
    const metrics = activity.metrics || []

    // 提取 GPS 数据
    const latData = metrics.find((m: any) => m.type === 'latitude')?.values || []
    const lonData = metrics.find((m: any) => m.type === 'longitude')?.values || []
    const eleData = metrics.find((m: any) => m.type === 'elevation')?.values || []
    const hrData = metrics.find((m: any) => m.type === 'heart_rate')?.values || []

    // 如果没有 GPS 数据，返回空 GPX
    if (latData.length === 0 || lonData.length === 0) {
      return this.generateEmptyGPX(activity)
    }

    // 对齐 lat/lon 数据点
    const trackPoints: Array<{
      lat: number
      lon: number
      time: string
      ele?: number
      hr?: number
    }> = []

    for (const [i, lat] of latData.entries()) {
      const lon = lonData[i]

      // 确保 lat/lon 时间戳对齐
      if (lat.start_epoch_ms !== lon.start_epoch_ms) {
        console.warn('Latitude and longitude timestamps do not match')
        continue
      }

      const point = {
        lat: lat.value,
        lon: lon.value,
        time: new Date(lat.start_epoch_ms).toISOString(),
      }

      // 添加海拔数据（通过时间戳匹配）
      const elePoint = eleData.find(
        (e: any) => e.start_epoch_ms <= lat.start_epoch_ms && lat.start_epoch_ms < e.end_epoch_ms,
      )
      if (elePoint) {
        Object.assign(point, { ele: elePoint.value })
      }

      // 添加心率数据（通过时间戳匹配）
      const hrPoint = hrData.find(
        (h: any) => h.start_epoch_ms <= lat.start_epoch_ms && lat.start_epoch_ms < h.end_epoch_ms,
      )
      if (hrPoint) {
        Object.assign(point, { hr: Math.round(hrPoint.value) })
      }

      trackPoints.push(point)
    }

    // 生成 GPX XML
    const activityName = activity.tags?.['com.nike.name'] || 'Nike Run'
    const gpx = this.buildGPXXML(activityName, trackPoints)

    return gpx
  }

  /**
   * 构建 GPX XML 字符串
   */
  private buildGPXXML(
    name: string,
    points: Array<{ lat: number; lon: number; time: string; ele?: number; hr?: number }>,
  ): string {
    const trackPointsXML = points
      .map((p) => {
        let xml = `      <trkpt lat="${p.lat}" lon="${p.lon}">\n`
        if (p.ele !== undefined) {
          xml += `        <ele>${p.ele}</ele>\n`
        }
        xml += `        <time>${p.time}</time>\n`

        // 添加心率扩展（Garmin TrackPointExtension）
        if (p.hr !== undefined) {
          xml += `        <extensions>\n`
          xml += `          <gpxtpx:TrackPointExtension xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">\n`
          xml += `            <gpxtpx:hr>${p.hr}</gpxtpx:hr>\n`
          xml += `          </gpxtpx:TrackPointExtension>\n`
          xml += `        </extensions>\n`
        }

        xml += `      </trkpt>`
        return xml
      })
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Nike Run Club" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <trk>
    <name>${this.escapeXML(name)}</name>
    <type>running</type>
    <trkseg>
${trackPointsXML}
    </trkseg>
  </trk>
</gpx>`
  }

  /**
   * 生成空 GPX（用于没有 GPS 数据的活动，如跑步机）
   */
  private generateEmptyGPX(activity: any): string {
    const activityName = activity.tags?.['com.nike.name'] || 'Nike Run'
    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Nike Run Club" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${this.escapeXML(activityName)}</name>
    <type>running</type>
    <trkseg>
    </trkseg>
  </trk>
</gpx>`
  }

  /**
   * XML 特殊字符转义
   */
  private escapeXML(str: string): string {
    return str
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;')
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 尝试获取第一页活动列表
      const response = await fetch(
        `${NIKE_API_BASE}/activities/before_id/v3/0?limit=1&types=run%2Cjogging&include_deleted=false`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      )
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 刷新访问令牌
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(NIKE_TOKEN_REFRESH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh access token')
    }

    const data = await response.json()
    this.accessToken = data.access_token

    // 更新 refresh token（如果返回了新的）
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token
    }
  }

  /**
   * 转换 Nike 数据格式到统一格式
   */
  private transformActivity(raw: any, gpxData?: string): RawActivity {
    // 从 summaries 提取统计数据
    const summaries = raw.summaries || []
    const getSummary = (metric: string) => {
      const summary = summaries.find((s: any) => s.metric === metric)
      return summary?.value
    }

    const distance = getSummary('distance') // Nike 返回的单位是公里
    const distanceInMeters = distance ? distance * 1000 : 0

    // 计算配速（秒/米）
    const durationMs = raw.active_duration_ms || 0
    const durationSec = Math.floor(durationMs / 1000)
    const averagePace = distanceInMeters > 0 ? durationSec / distanceInMeters : undefined

    // 提取海拔增益
    const elevationGain = getSummary('ascent') // Nike 返回的单位可能是米

    // 提取心率数据
    const averageHeartRate = getSummary('heart_rate')
    const maxHeartRate = raw.metrics
      ?.find((m: any) => m.type === 'heart_rate')
      ?.values?.reduce((max: number, v: any) => Math.max(max, v.value), 0)

    // 提取卡路里
    const calories = getSummary('calories')

    // 提取活动名称
    const title = raw.tags?.['com.nike.name'] || '跑步'

    return {
      id: raw.id,
      title,
      type: this.mapActivityType(raw.type),
      startTime: new Date(raw.start_epoch_ms),
      duration: durationSec,
      distance: distanceInMeters,
      gpxData,
      averagePace,
      bestPace: undefined, // Nike 不直接提供最佳配速
      elevationGain: elevationGain || undefined,
      averageHeartRate: averageHeartRate ? Math.round(averageHeartRate) : undefined,
      maxHeartRate: maxHeartRate ? Math.round(maxHeartRate) : undefined,
      calories: calories ? Math.round(calories) : undefined,
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
