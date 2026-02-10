/**
 * Race Matcher Module
 *
 * On-demand race matching for sync activities using zuicool.com scraping.
 * Caches race data per year during sync to avoid redundant requests.
 */

import type { Browser } from 'playwright'
import { chromium } from 'playwright'

/**
 * Race event definition
 */
export interface Race {
  name: string
  date: string // YYYY-MM-DD
  city: string
  coordinates?: { lat: number; lng: number }
}

/**
 * City coordinates mapping for Chinese cities
 * Used for coordinate-based matching between activity GPS and race location
 */
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // 直辖市
  北京: { lat: 39.9042, lng: 116.4074 },
  上海: { lat: 31.2304, lng: 121.4737 },
  天津: { lat: 39.0842, lng: 117.2009 },
  重庆: { lat: 29.563, lng: 106.5516 },
  // 一线/新一线
  广州: { lat: 23.1291, lng: 113.2644 },
  深圳: { lat: 22.5431, lng: 114.0579 },
  杭州: { lat: 30.2741, lng: 120.1551 },
  成都: { lat: 30.5728, lng: 104.0668 },
  武汉: { lat: 30.5928, lng: 114.3055 },
  西安: { lat: 34.3416, lng: 108.9398 },
  南京: { lat: 32.0603, lng: 118.7969 },
  苏州: { lat: 31.2989, lng: 120.5853 },
  // 省会及主要城市
  厦门: { lat: 24.4798, lng: 118.0894 },
  青岛: { lat: 36.0671, lng: 120.3826 },
  大连: { lat: 38.914, lng: 121.6147 },
  沈阳: { lat: 41.8057, lng: 123.4315 },
  长沙: { lat: 28.2282, lng: 112.9388 },
  郑州: { lat: 34.7466, lng: 113.6253 },
  福州: { lat: 26.0745, lng: 119.2965 },
  昆明: { lat: 24.8801, lng: 102.8329 },
  南宁: { lat: 22.817, lng: 108.3665 },
  贵阳: { lat: 26.647, lng: 106.6302 },
  兰州: { lat: 36.0611, lng: 103.8343 },
  哈尔滨: { lat: 45.8038, lng: 126.535 },
  长春: { lat: 43.8171, lng: 125.3235 },
  太原: { lat: 37.8706, lng: 112.5489 },
  石家庄: { lat: 38.0428, lng: 114.5149 },
  济南: { lat: 36.6512, lng: 117.1201 },
  合肥: { lat: 31.8206, lng: 117.2272 },
  南昌: { lat: 28.682, lng: 115.8579 },
  无锡: { lat: 31.4912, lng: 120.3119 },
  宁波: { lat: 29.8683, lng: 121.544 },
  温州: { lat: 27.9939, lng: 120.6994 },
  东莞: { lat: 23.043, lng: 113.7633 },
  佛山: { lat: 23.0218, lng: 113.1219 },
  珠海: { lat: 22.271, lng: 113.5767 },
  海口: { lat: 20.044, lng: 110.1999 },
  // 浙江
  扬州: { lat: 32.3936, lng: 119.4126 },
  绍兴: { lat: 30.0303, lng: 120.5801 },
  嘉兴: { lat: 30.7522, lng: 120.755 },
  金华: { lat: 29.0787, lng: 119.6495 },
  台州: { lat: 28.6563, lng: 121.4208 },
  湖州: { lat: 30.8927, lng: 120.0934 },
  衢州: { lat: 28.9569, lng: 118.8593 },
  长兴: { lat: 31.0261, lng: 119.9106 },
  德清: { lat: 30.5425, lng: 119.9775 },
  安吉: { lat: 30.6382, lng: 119.6802 },
  // 四川
  雅安: { lat: 29.9816, lng: 103.0013 },
  泸州: { lat: 28.8717, lng: 105.4423 },
  乐山: { lat: 29.5521, lng: 103.7659 },
  绵阳: { lat: 31.4678, lng: 104.6796 },
  德阳: { lat: 31.1279, lng: 104.3979 },
  眉山: { lat: 30.0754, lng: 103.8485 },
  内江: { lat: 29.5801, lng: 105.0584 },
  自贡: { lat: 29.3393, lng: 104.7786 },
  攀枝花: { lat: 26.5823, lng: 101.7185 },
  遂宁: { lat: 30.5328, lng: 105.5927 },
  南充: { lat: 30.8373, lng: 106.1106 },
  广元: { lat: 32.4353, lng: 105.8433 },
  达州: { lat: 31.2094, lng: 107.4678 },
  宜宾: { lat: 28.7513, lng: 104.6417 },
  广安: { lat: 30.4563, lng: 106.6333 },
  // 云南
  丽江: { lat: 26.8721, lng: 100.2299 },
  大理: { lat: 25.6065, lng: 100.2676 },
  西双版纳: { lat: 22.0017, lng: 100.7975 },
  普洱: { lat: 22.7772, lng: 100.9669 },
  曲靖: { lat: 25.4902, lng: 103.7961 },
  玉溪: { lat: 24.3528, lng: 102.5428 },
  // 广东
  惠州: { lat: 23.1115, lng: 114.4161 },
  汕头: { lat: 23.354, lng: 116.6815 },
  中山: { lat: 22.5176, lng: 113.3926 },
  江门: { lat: 22.5789, lng: 113.0815 },
  湛江: { lat: 21.2707, lng: 110.3594 },
  梅州: { lat: 24.2886, lng: 116.1225 },
  肇庆: { lat: 23.0469, lng: 112.4654 },
  清远: { lat: 23.6819, lng: 113.0561 },
  // 山东
  东营: { lat: 37.4346, lng: 118.6749 },
  潍坊: { lat: 36.7069, lng: 119.1619 },
  淄博: { lat: 36.8131, lng: 118.0548 },
  烟台: { lat: 37.4638, lng: 121.4479 },
  威海: { lat: 37.5091, lng: 122.1209 },
  日照: { lat: 35.4164, lng: 119.5269 },
  临沂: { lat: 35.1041, lng: 118.3564 },
  泰安: { lat: 36.1999, lng: 117.0876 },
  菏泽: { lat: 35.2339, lng: 115.4806 },
  // 河南
  洛阳: { lat: 34.6197, lng: 112.4539 },
  开封: { lat: 34.7971, lng: 114.3075 },
  南阳: { lat: 32.9908, lng: 112.5283 },
  许昌: { lat: 34.0357, lng: 113.8523 },
  焦作: { lat: 35.2156, lng: 113.2416 },
  新乡: { lat: 35.3026, lng: 113.9268 },
  信阳: { lat: 32.1264, lng: 114.0913 },
  // 河北
  秦皇岛: { lat: 39.9354, lng: 119.5996 },
  唐山: { lat: 39.6292, lng: 118.1802 },
  保定: { lat: 38.8739, lng: 115.4646 },
  邯郸: { lat: 36.6256, lng: 114.5391 },
  廊坊: { lat: 39.5186, lng: 116.6831 },
  张家口: { lat: 40.8242, lng: 114.8793 },
  // 江苏
  常州: { lat: 31.8113, lng: 119.9741 },
  南通: { lat: 31.9807, lng: 120.8942 },
  连云港: { lat: 34.5966, lng: 119.2216 },
  淮安: { lat: 33.6104, lng: 119.0153 },
  盐城: { lat: 33.3477, lng: 120.1614 },
  镇江: { lat: 32.1879, lng: 119.4251 },
  泰州: { lat: 32.4558, lng: 119.9231 },
  徐州: { lat: 34.2044, lng: 117.2859 },
  // 安徽
  芜湖: { lat: 31.3524, lng: 118.4331 },
  蚌埠: { lat: 32.9168, lng: 117.3893 },
  马鞍山: { lat: 31.6886, lng: 118.5062 },
  黄山: { lat: 29.7147, lng: 118.3376 },
  滁州: { lat: 32.3017, lng: 118.3171 },
  阜阳: { lat: 32.8896, lng: 115.8142 },
  安庆: { lat: 30.5432, lng: 117.0634 },
  // 福建
  泉州: { lat: 24.8741, lng: 118.6756 },
  漳州: { lat: 24.5128, lng: 117.6472 },
  莆田: { lat: 25.454, lng: 119.0077 },
  南平: { lat: 26.6419, lng: 118.1777 },
  龙岩: { lat: 25.0758, lng: 117.0171 },
  // 湖南
  株洲: { lat: 27.8274, lng: 113.1341 },
  衡阳: { lat: 26.8936, lng: 112.5719 },
  岳阳: { lat: 29.3572, lng: 113.1289 },
  常德: { lat: 29.0318, lng: 111.6986 },
  张家界: { lat: 29.1173, lng: 110.4793 },
  郴州: { lat: 25.7703, lng: 113.0149 },
  // 湖北
  宜昌: { lat: 30.6918, lng: 111.2864 },
  襄阳: { lat: 32.0089, lng: 112.1226 },
  荆州: { lat: 30.3261, lng: 112.2391 },
  黄冈: { lat: 30.4461, lng: 114.8724 },
  孝感: { lat: 30.9247, lng: 113.9269 },
  恩施: { lat: 30.2722, lng: 109.4886 },
  仙桃: { lat: 30.3622, lng: 113.4539 },
  // 江西
  九江: { lat: 29.7051, lng: 116.0019 },
  景德镇: { lat: 29.2687, lng: 117.1784 },
  赣州: { lat: 25.8312, lng: 114.9336 },
  上饶: { lat: 28.4551, lng: 117.9433 },
  吉安: { lat: 27.1138, lng: 114.9926 },
  // 广西
  桂林: { lat: 25.2736, lng: 110.2907 },
  柳州: { lat: 24.3264, lng: 109.4281 },
  北海: { lat: 21.4733, lng: 109.1198 },
  // 海南
  三亚: { lat: 18.2528, lng: 109.5119 },
  儋州: { lat: 19.5175, lng: 109.5809 },
  万宁: { lat: 18.7962, lng: 110.3926 },
  // 贵州
  遵义: { lat: 27.7254, lng: 106.9271 },
  六盘水: { lat: 26.5929, lng: 104.8307 },
  // 港澳台
  香港: { lat: 22.3193, lng: 114.1694 },
  澳门: { lat: 22.1987, lng: 113.5439 },
  台北: { lat: 25.033, lng: 121.5654 },
  高雄: { lat: 22.6273, lng: 120.3014 },
}

const KNOWN_CITIES = Object.keys(CITY_COORDINATES)

// In-memory cache for races by year (shared across a sync session)
const yearRacesCache = new Map<number, Race[]>()

// Shared browser instance for the sync session
let sharedBrowser: Browser | null = null

/**
 * Initialize the race matcher (should be called at sync start)
 */
export async function initRaceMatcher(): Promise<void> {
  if (!sharedBrowser) {
    sharedBrowser = await chromium.launch({ headless: true })
    console.info('[RaceMatcher] Browser initialized')
  }
}

/**
 * Clean up race matcher resources (should be called at sync end)
 */
export async function cleanupRaceMatcher(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close()
    sharedBrowser = null
    console.info('[RaceMatcher] Browser closed')
  }
  yearRacesCache.clear()
  console.info('[RaceMatcher] Cache cleared')
}

/**
 * Extract city from race name
 */
function extractCityFromName(name: string): string | null {
  for (const city of KNOWN_CITIES) {
    if (name.includes(city)) {
      return city
    }
  }
  return null
}

/**
 * Extract city from location string
 */
function extractCity(location: string, raceName?: string): string {
  // First try to extract from race name (more accurate)
  if (raceName) {
    const cityFromName = extractCityFromName(raceName)
    if (cityFromName) {
      return cityFromName
    }
  }

  // Try to match city name from location
  const cityMatch = location.match(/^([\u4e00-\u9fa5]+)[・·]?([\u4e00-\u9fa5]+)?/)
  if (cityMatch) {
    const provinces = [
      '北京',
      '上海',
      '天津',
      '重庆',
      '河北',
      '山西',
      '辽宁',
      '吉林',
      '黑龙江',
      '江苏',
      '浙江',
      '安徽',
      '福建',
      '江西',
      '山东',
      '河南',
      '湖北',
      '湖南',
      '广东',
      '海南',
      '四川',
      '贵州',
      '云南',
      '陕西',
      '甘肃',
      '青海',
      '台湾',
      '内蒙古',
      '广西',
      '西藏',
      '宁夏',
      '新疆',
    ]

    const firstPart = cityMatch[1]
    const secondPart = cityMatch[2]

    // Direct municipalities
    if (['北京', '上海', '天津', '重庆'].includes(firstPart)) {
      return firstPart
    }

    // If first part is a province, use second part
    if (provinces.includes(firstPart) && secondPart) {
      return secondPart.replace(/[市区县]$/, '')
    }

    return firstPart.replace(/[市区县]$/, '')
  }

  return '未知'
}

/**
 * Parse date string from zuicool format
 * Format: "2026.03.08"
 */
function parseDate(dateStr: string): string {
  const dotMatch = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})/)
  if (dotMatch) {
    return `${dotMatch[1]}-${dotMatch[2]}-${dotMatch[3]}`
  }
  return ''
}

/**
 * Check if a race is a real marathon (not training, online, or other events)
 */
function isRealMarathon(name: string): boolean {
  const excludePatterns = [
    /线上/,
    /训练/,
    /轨迹/,
    /徒步/,
    /急救/,
    /培训/,
    /越野/,
    /跑山/,
    /山径/,
    /生态跑/,
    /欢乐跑/,
    /健康跑/,
    /踏春/,
    /踏青/,
    /迎春/,
    /赏花/,
    /女子.*跑/,
    /亲子/,
    /少年/,
    /少儿/,
  ]

  const includePatterns = [/马拉松/, /半程/, /半马/, /全马/, /10公里精英赛/]

  const hasExclude = excludePatterns.some((p) => p.test(name))
  const hasInclude = includePatterns.some((p) => p.test(name))

  return hasInclude && !hasExclude
}

/**
 * Scrape races for a specific year from zuicool.com
 */
async function scrapeRacesForYear(year: number): Promise<Race[]> {
  if (!sharedBrowser) {
    throw new Error('[RaceMatcher] Browser not initialized. Call initRaceMatcher() first.')
  }

  const races: Race[] = []
  const page = await sharedBrowser.newPage()
  let currentPage = 1
  const maxPages = 20 // Safety limit

  console.info(`[RaceMatcher] Scraping ${year} races from zuicool.com...`)

  try {
    while (currentPage <= maxPages) {
      const url = `https://zuicool.com/events?year=${year}&type=run&page=${currentPage}&per-page=100`

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
        const content = await page.content()

        // Parse race entries from the events page
        const racePattern =
          /<a[^>]*href="https:\/\/zuicool\.com\/event\/\d+"[^>]*>([^<]+)<\/a>[\s\S]*?(\d{4}\.\d{2}\.\d{2})\s*·\s*([^<"]+)/g

        let match
        let foundCount = 0
        while ((match = racePattern.exec(content)) !== null) {
          const name = match[1].trim()
          const dateStr = match[2]
          const location = match[3].trim()

          // Skip non-marathon events
          if (!isRealMarathon(name)) {
            continue
          }

          const date = parseDate(dateStr)
          if (!date) continue

          const city = extractCity(location, name)
          const coordinates = CITY_COORDINATES[city]

          races.push({
            name,
            date,
            city,
            coordinates,
          })
          foundCount++
        }

        console.info(`[RaceMatcher] Page ${currentPage}: Found ${foundCount} marathons`)

        // Check if there's a next page
        if (!content.includes(`page=${currentPage + 1}`)) {
          break
        }

        currentPage++
      } catch (error) {
        console.warn(`[RaceMatcher] Error on page ${currentPage}:`, error)
        break
      }
    }
  } finally {
    await page.close()
  }

  console.info(`[RaceMatcher] Total ${races.length} marathons found for ${year}`)
  return races
}

/**
 * Get races for a specific year (from cache or scrape)
 */
async function getRacesForYear(year: number): Promise<Race[]> {
  // Check cache first
  if (yearRacesCache.has(year)) {
    console.info(`[RaceMatcher] Using cached races for ${year}`)
    return yearRacesCache.get(year)!
  }

  // Scrape and cache
  const races = await scrapeRacesForYear(year)
  yearRacesCache.set(year, races)
  return races
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
function calculateGeoDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Check if two dates are within a tolerance range
 */
function datesMatch(date1: Date, date2: Date, toleranceDays = 1): boolean {
  const diffMs = Math.abs(date1.getTime() - date2.getTime())
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= toleranceDays
}

/**
 * Match an activity to a race event
 *
 * @param activityDate - Activity start date
 * @param distanceMeters - Activity distance in meters
 * @param coordinates - Activity start coordinates (optional)
 * @returns Matched race name or null
 */
export async function matchRaceForActivity(
  activityDate: Date,
  distanceMeters: number,
  coordinates?: { lat: number; lng: number },
): Promise<string | null> {
  // Only match for half marathon or longer (≥20500m)
  if (distanceMeters < 20500) {
    return null
  }

  const year = activityDate.getFullYear()

  try {
    const races = await getRacesForYear(year)
    const candidates: Array<{ race: Race; score: number }> = []

    for (const race of races) {
      const raceDate = new Date(race.date)

      // Check date match (±1 day tolerance)
      if (!datesMatch(activityDate, raceDate)) {
        continue
      }

      // Calculate match score
      let score = 1

      // Coordinate match bonus (within 50km of race start)
      if (coordinates && race.coordinates) {
        const distance = calculateGeoDistance(
          coordinates.lat,
          coordinates.lng,
          race.coordinates.lat,
          race.coordinates.lng,
        )
        if (distance < 50) {
          score += 3
        }
      }

      candidates.push({ race, score })
    }

    // Require location confirmation (score > 1) to avoid false positives
    // Reason: Without coordinate verification, matching just by date
    // can produce false positives (e.g., user runs half marathon on same day as
    // a race in another city)
    if (candidates.length === 0) {
      return null
    }

    candidates.sort((a, b) => b.score - a.score)
    const bestMatch = candidates[0]

    if (bestMatch.score <= 1) {
      // Only date match, not enough for confident identification
      // But if there's exactly one race on that day, use it
      if (candidates.length === 1) {
        const year = activityDate.getFullYear()
        const yearStr = String(year)
        if (bestMatch.race.name.startsWith(yearStr)) {
          return bestMatch.race.name
        }
        return `${year} ${bestMatch.race.name}`
      }
      return null
    }

    // Return race name with year if not already present
    const yearStr = String(year)
    if (bestMatch.race.name.startsWith(yearStr)) {
      return bestMatch.race.name
    }
    return `${year} ${bestMatch.race.name}`
  } catch (error) {
    console.error(`[RaceMatcher] Error matching race:`, error)
    return null
  }
}

/**
 * Extract first GPS coordinates from GPX data
 */
export function extractCoordinatesFromGPX(
  gpxData: string | null | undefined,
): { lat: number; lng: number } | undefined {
  if (!gpxData) return undefined

  // Reason: GPX format uses <trkpt lat="..." lon="..."> for track points
  const trkptMatch = gpxData.match(/<trkpt\s+lat=["']([^"']+)["']\s+lon=["']([^"']+)["']/)
  if (trkptMatch) {
    const lat = Number.parseFloat(trkptMatch[1])
    const lng = Number.parseFloat(trkptMatch[2])
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng }
    }
  }

  return undefined
}
