/**
 * Open-Meteo Weather Service
 *
 * Fetches historical weather data from the free Open-Meteo Archive API.
 * No API key required. Rate limit: 10,000 requests/day.
 */

export interface WeatherData {
  temperature: number // °C
  humidity: number // %
  windSpeed: number // km/h
  weatherCode: number // WMO code
  description: string // Human-readable description
}

/**
 * WMO Weather Interpretation Codes → Chinese descriptions
 * Reference: https://open-meteo.com/en/docs#weathervariables
 */
const WMO_DESCRIPTIONS: Record<number, string> = {
  0: '晴',
  1: '大部晴朗',
  2: '多云',
  3: '阴天',
  45: '雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '毛毛雨',
  55: '大毛毛雨',
  56: '冻毛毛雨',
  57: '大冻毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '小冻雨',
  67: '大冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '小阵雨',
  81: '阵雨',
  82: '大阵雨',
  85: '小阵雪',
  86: '大阵雪',
  95: '雷暴',
  96: '雷暴伴小冰雹',
  99: '雷暴伴大冰雹',
}

function getWeatherDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? '未知'
}

interface OpenMeteoHourlyResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    wind_speed_10m: number[]
    weather_code: number[]
  }
}

/**
 * Fetch historical weather for a specific activity location and time.
 * Uses Open-Meteo Archive API which provides free historical weather data.
 *
 * @returns WeatherData or null if the request fails or data is unavailable
 */
export async function fetchWeatherForActivity(
  lat: number,
  lng: number,
  startTime: Date,
): Promise<WeatherData | null> {
  try {
    // Format date as YYYY-MM-DD for the API
    const dateStr = startTime.toISOString().split('T')[0]
    const hour = startTime.getUTCHours()

    const url = new URL('https://archive-api.open-meteo.com/v1/archive')
    url.searchParams.set('latitude', lat.toFixed(4))
    url.searchParams.set('longitude', lng.toFixed(4))
    url.searchParams.set('start_date', dateStr)
    url.searchParams.set('end_date', dateStr)
    url.searchParams.set(
      'hourly',
      'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    )

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      console.warn(`Open-Meteo API returned ${response.status} for ${dateStr}`)
      return null
    }

    const data = (await response.json()) as OpenMeteoHourlyResponse

    if (!data.hourly || data.hourly.time.length === 0) {
      return null
    }

    // Reason: Open-Meteo returns UTC hourly data; pick the hour matching the activity start
    const hourIndex = Math.min(hour, data.hourly.time.length - 1)

    const temperature = data.hourly.temperature_2m[hourIndex]
    const humidity = data.hourly.relative_humidity_2m[hourIndex]
    const windSpeed = data.hourly.wind_speed_10m[hourIndex]
    const weatherCode = data.hourly.weather_code[hourIndex]

    // Validate that we got real data (not null/undefined from sparse responses)
    if (temperature == null || humidity == null || windSpeed == null || weatherCode == null) {
      return null
    }

    return {
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed * 10) / 10,
      weatherCode,
      description: getWeatherDescription(weatherCode),
    }
  } catch (error) {
    console.warn('Failed to fetch weather data:', error)
    return null
  }
}
