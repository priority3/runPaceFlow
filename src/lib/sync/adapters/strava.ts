import { generateSmartName } from '@/lib/activity/naming'

import type { RawActivity, SyncAdapter } from './base'

/**
 * Strava API Configuration
 */
const STRAVA_API_BASE = 'https://www.strava.com/api/v3'
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'

/**
 * Strava API Response Types
 */
interface StravaActivity {
  id: number
  name: string
  type: string
  start_date: string
  start_date_local: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  average_speed: number
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  calories?: number
  map?: {
    summary_polyline: string
    polyline?: string
  }
}

interface StravaStream {
  type: string
  data: number[]
  series_type: string
  original_size: number
  resolution: string
}

interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
}

/**
 * Strava Adapter
 *
 * Synchronizes running data from Strava
 *
 * Authentication:
 * - Uses OAuth2 with client_id, client_secret, and refresh_token
 * - Automatically refreshes access token when expired
 *
 * Features:
 * - Fetches activities with pagination
 * - Downloads detailed activity data including GPS streams
 * - Converts Strava data to standardized format
 * - Supports filtering by date and activity type
 *
 * @example
 * ```typescript
 * const adapter = new StravaAdapter(
 *   process.env.STRAVA_CLIENT_ID!,
 *   process.env.STRAVA_CLIENT_SECRET!,
 *   process.env.STRAVA_REFRESH_TOKEN!
 * )
 *
 * const activities = await adapter.getActivities({ limit: 50 })
 * ```
 */
export class StravaAdapter implements SyncAdapter {
  name = 'strava'
  private clientId: string
  private clientSecret: string
  private refreshToken: string
  private accessToken?: string
  private tokenExpiresAt?: number

  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.refreshToken = refreshToken
  }

  /**
   * Authenticate with Strava
   * Refreshes the access token if needed
   */
  async authenticate(_credentials: Record<string, any>): Promise<boolean> {
    try {
      await this.ensureValidToken()
      return true
    } catch (error) {
      console.error('Strava authentication failed:', error)
      return false
    }
  }

  /**
   * Get activities from Strava
   *
   * @param options - Filter options
   * @param options.startDate - Start date filter (optional)
   * @param options.endDate - End date filter (optional)
   * @param options.after - Unix timestamp for incremental sync (optional)
   * @param options.limit - Maximum number of activities to fetch
   * @param options.page - Page number for pagination (starts at 1)
   */
  async getActivities(
    options: {
      startDate?: Date
      endDate?: Date
      after?: number
      limit?: number
      page?: number
    } = {},
  ): Promise<RawActivity[]> {
    await this.ensureValidToken()

    const activities: RawActivity[] = []
    let currentPage = options.page || 1
    const perPage = 50 // Strava's max per page
    const totalLimit = options.limit || 100

    try {
      while (activities.length < totalLimit) {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          per_page: perPage.toString(),
        })

        // Add date filters if provided
        // Prefer direct 'after' timestamp for incremental sync
        if (options.after) {
          params.append('after', options.after.toString())
        } else if (options.startDate) {
          params.append('after', Math.floor(options.startDate.getTime() / 1000).toString())
        }
        if (options.endDate) {
          params.append('before', Math.floor(options.endDate.getTime() / 1000).toString())
        }

        const response = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params}`, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Strava API error: ${response.status} ${response.statusText}`)
        }

        const pageActivities: StravaActivity[] = await response.json()

        // No more activities
        if (pageActivities.length === 0) {
          break
        }

        // Fetch detailed data for each activity (only running activities)
        for (const activity of pageActivities) {
          if (activities.length >= totalLimit) {
            break
          }

          // Skip non-running activities
          if (!this.isRunningActivity(activity.type)) {
            console.info(`⏭️ Skipping non-running activity ${activity.id} (type: ${activity.type})`)
            continue
          }

          try {
            const detailedActivity = await this.getActivityDetail(activity.id.toString())
            activities.push(detailedActivity)
          } catch (error) {
            console.error(`Failed to fetch activity ${activity.id}:`, error)
            // Continue with other activities even if one fails
          }
        }

        // Check if we should fetch more pages
        if (pageActivities.length < perPage) {
          break // Last page
        }

        currentPage++
      }

      return activities
    } catch (error) {
      console.error('Failed to fetch Strava activities:', error)
      throw error
    }
  }

  /**
   * Get detailed activity data including GPS streams
   */
  async getActivityDetail(id: string): Promise<RawActivity> {
    await this.ensureValidToken()

    const activityId = Number.parseInt(id, 10)
    if (Number.isNaN(activityId)) {
      throw new TypeError(`Invalid activity ID: ${id}`)
    }

    // Fetch activity details
    const activityResponse = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!activityResponse.ok) {
      throw new Error(`Failed to fetch activity ${activityId}: ${activityResponse.statusText}`)
    }

    const activity: StravaActivity = await activityResponse.json()

    // Fetch GPS streams (latlng, time, altitude, heartrate)
    let streams: Record<string, StravaStream> = {}
    try {
      const streamsResponse = await fetch(
        `${STRAVA_API_BASE}/activities/${activityId}/streams?keys=latlng,time,altitude,heartrate,distance`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      )

      if (streamsResponse.ok) {
        const streamsList: StravaStream[] = await streamsResponse.json()
        // Check if response is an array
        if (Array.isArray(streamsList)) {
          console.info(`✅ Fetched ${streamsList.length} streams for activity ${activityId}`)
          streams = streamsList.reduce(
            (acc, stream) => {
              acc[stream.type] = stream
              return acc
            },
            {} as Record<string, StravaStream>,
          )
        } else {
          console.warn(`Unexpected streams response format for activity ${activityId}`)
        }
      } else {
        console.warn(
          `Failed to fetch streams for activity ${activityId}: ${streamsResponse.status} ${streamsResponse.statusText}`,
        )
      }
    } catch (error) {
      console.error(`Failed to fetch streams for activity ${activityId}:`, error)
      // Continue without streams
    }

    // Convert to RawActivity format
    return this.convertToRawActivity(activity, streams)
  }

  /**
   * Download GPX file for a specific activity
   */
  async downloadGPX(id: string): Promise<string> {
    await this.ensureValidToken()

    const activityId = Number.parseInt(id, 10)
    if (Number.isNaN(activityId)) {
      throw new TypeError(`Invalid activity ID: ${id}`)
    }

    // Fetch activity details
    const activityResponse = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!activityResponse.ok) {
      throw new Error(`Failed to fetch activity ${activityId}: ${activityResponse.statusText}`)
    }

    const activity: StravaActivity = await activityResponse.json()

    // Fetch GPS streams
    let streams: Record<string, StravaStream> = {}
    try {
      const streamsResponse = await fetch(
        `${STRAVA_API_BASE}/activities/${activityId}/streams?keys=latlng,time,altitude,heartrate&key_by_type=true`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      )

      if (streamsResponse.ok) {
        const streamsList: StravaStream[] = await streamsResponse.json()
        streams = streamsList.reduce(
          (acc, stream) => {
            acc[stream.type] = stream
            return acc
          },
          {} as Record<string, StravaStream>,
        )
      }
    } catch (error) {
      console.error(`Failed to fetch streams for activity ${activityId}:`, error)
    }

    // Generate and return GPX
    return this.generateGPX(activity, streams)
  }

  /**
   * Health check - verify API access
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureValidToken()

      const response = await fetch(`${STRAVA_API_BASE}/athlete`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Ensure we have a valid access token
   * Automatically refreshes if expired
   */
  private async ensureValidToken(): Promise<void> {
    const now = Math.floor(Date.now() / 1000)

    // Check if token is still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > now + 300) {
      return
    }

    // Refresh the token
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh Strava token: ${response.statusText}`)
    }

    const data: StravaTokenResponse = await response.json()

    this.accessToken = data.access_token
    this.refreshToken = data.refresh_token // Update refresh token
    this.tokenExpiresAt = data.expires_at
  }

  /**
   * Convert Strava activity to standardized RawActivity format
   */
  private convertToRawActivity(
    activity: StravaActivity,
    streams: Record<string, StravaStream>,
  ): RawActivity {
    // Build GPX data from streams
    let gpxData: string | undefined

    if (streams.latlng && streams.time) {
      gpxData = this.generateGPX(activity, streams)
    }

    // Calculate average pace (min/km) from average speed (m/s)
    const averagePace = activity.average_speed > 0 ? 1000 / activity.average_speed : undefined

    // Calculate best pace from max speed
    const bestPace = activity.max_speed > 0 ? 1000 / activity.max_speed : undefined

    // Generate smart name based on distance and race matching
    const startTime = new Date(activity.start_date)
    const title = generateSmartName(
      { distance: activity.distance, startTime, gpxData: gpxData || null },
      activity.name,
    )

    return {
      id: activity.id.toString(),
      source: 'strava',
      type: this.mapActivityType(activity.type),
      isIndoor: this.isIndoorActivity(activity.type),
      title,
      startTime: new Date(activity.start_date),
      duration: activity.moving_time, // Use moving_time (excludes pauses)
      distance: activity.distance,
      averagePace,
      bestPace,
      elevationGain: activity.total_elevation_gain,
      averageHeartRate: activity.average_heartrate
        ? Math.round(activity.average_heartrate)
        : undefined,
      maxHeartRate: activity.max_heartrate ? Math.round(activity.max_heartrate) : undefined,
      calories: activity.calories,
      gpxData,
    }
  }

  /**
   * Generate GPX XML from Strava streams
   */
  private generateGPX(activity: StravaActivity, streams: Record<string, StravaStream>): string {
    const latlng = streams.latlng?.data || []
    const time = streams.time?.data || []
    const altitude = streams.altitude?.data || []
    const heartrate = streams.heartrate?.data || []

    if (latlng.length === 0) {
      return ''
    }

    const startTime = new Date(activity.start_date)

    const trackPoints = latlng
      .map((point: any, index: number) => {
        const [lat, lon] = point
        const timestamp = new Date(startTime.getTime() + (time[index] || 0) * 1000).toISOString()
        const ele = altitude[index] !== undefined ? altitude[index] : 0
        const hr = heartrate[index]

        let trkpt = `    <trkpt lat="${lat}" lon="${lon}">
      <ele>${ele}</ele>
      <time>${timestamp}</time>`

        if (hr !== undefined) {
          trkpt += `
      <extensions>
        <gpxtpx:TrackPointExtension>
          <gpxtpx:hr>${Math.round(hr)}</gpxtpx:hr>
        </gpxtpx:TrackPointExtension>
      </extensions>`
        }

        trkpt += `
    </trkpt>`

        return trkpt
      })
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RunPaceFlow Strava Sync"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${activity.name}</name>
    <time>${activity.start_date}</time>
  </metadata>
  <trk>
    <name>${activity.name}</name>
    <type>${activity.type}</type>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`
  }

  /**
   * Map Strava activity type to standardized type
   */
  private mapActivityType(
    stravaType: string,
  ): 'running' | 'cycling' | 'walking' | 'swimming' | 'other' {
    const typeMap: Record<string, 'running' | 'cycling' | 'walking' | 'swimming' | 'other'> = {
      Run: 'running',
      TrailRun: 'running',
      VirtualRun: 'running',
      Ride: 'cycling',
      VirtualRide: 'cycling',
      Walk: 'walking',
      Hike: 'walking',
      Swim: 'swimming',
    }

    return typeMap[stravaType] || 'other'
  }

  /**
   * Check if an activity type is running
   */
  private isRunningActivity(stravaType: string): boolean {
    const runningTypes = ['Run', 'TrailRun', 'VirtualRun']
    return runningTypes.includes(stravaType)
  }

  /**
   * Check if an activity is indoor (treadmill, indoor cycling, etc.)
   */
  private isIndoorActivity(stravaType: string): boolean {
    const indoorTypes = ['VirtualRun', 'VirtualRide', 'Treadmill']
    return indoorTypes.includes(stravaType)
  }
}
