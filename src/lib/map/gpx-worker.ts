/**
 * Web Worker for GPX parsing
 *
 * Offloads GPX XML parsing and Haversine distance calculations
 * from the main thread to avoid blocking UI during long runs
 * with 1000+ track points.
 */

export interface GpxWorkerInput {
  gpxString: string
}

export interface GpxWorkerTrackPoint {
  longitude: number
  latitude: number
  elevation?: number
  time: string // ISO string — Date objects can't cross worker boundary
  distance: number
}

export interface GpxWorkerHeartRateEntry {
  distance: number
  heartRate: number
}

export interface GpxWorkerOutput {
  trackPoints: GpxWorkerTrackPoint[]
  heartRateData: GpxWorkerHeartRateEntry[]
  error?: string
}

/**
 * Haversine distance between two lat/lon points in meters.
 * Duplicated here because workers can't import from the main bundle.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const toRad = (deg: number) => deg * (Math.PI / 180)
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Lightweight GPX parser using regex — avoids pulling in fast-xml-parser
 * inside the worker bundle. Extracts lat, lon, ele, time, and heart rate.
 */
function parseGpxInWorker(gpxString: string): GpxWorkerOutput {
  const trackPoints: GpxWorkerTrackPoint[] = []
  const heartRateData: GpxWorkerHeartRateEntry[] = []

  // Reason: Two regex patterns cover both attribute orderings (lat/lon vs lon/lat)
  const trkptRegex =
    /<trkpt[^>]+lat=["']([^"']+)["'][^>]+lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/trkpt>/gi

  let match: RegExpExecArray | null
  let cumulativeDistance = 0

  while ((match = trkptRegex.exec(gpxString)) !== null) {
    const lat = Number.parseFloat(match[1])
    const lon = Number.parseFloat(match[2])
    const content = match[3]

    if (Number.isNaN(lat) || Number.isNaN(lon)) continue

    // Distance from previous point
    if (trackPoints.length > 0) {
      const prev = trackPoints[trackPoints.length - 1]
      cumulativeDistance += haversineDistance(prev.latitude, prev.longitude, lat, lon)
    }

    // Extract time
    const timeMatch = content.match(/<time>([^<]+)<\/time>/i)
    const timeStr = timeMatch ? timeMatch[1] : new Date().toISOString()

    // Extract elevation
    let elevation: number | undefined
    const eleMatch = content.match(/<ele>([^<]+)<\/ele>/i)
    if (eleMatch) {
      const ele = Number.parseFloat(eleMatch[1])
      if (!Number.isNaN(ele)) elevation = ele
    }

    // Extract heart rate from Garmin TrackPointExtension
    const hrMatch = content.match(/<(?:gpxtpx:|ns3:)?hr>(\d+)<\/(?:gpxtpx:|ns3:)?hr>/i)
    if (hrMatch) {
      const hr = Number.parseInt(hrMatch[1])
      if (!Number.isNaN(hr)) {
        heartRateData.push({ distance: cumulativeDistance, heartRate: hr })
      }
    }

    trackPoints.push({
      longitude: lon,
      latitude: lat,
      elevation,
      time: timeStr,
      distance: cumulativeDistance,
    })
  }

  // Fallback: try lon/lat attribute order if nothing was found
  if (trackPoints.length === 0) {
    const altRegex =
      /<trkpt[^>]+lon=["']([^"']+)["'][^>]+lat=["']([^"']+)["'][^>]*>([\s\S]*?)<\/trkpt>/gi

    while ((match = altRegex.exec(gpxString)) !== null) {
      const lon = Number.parseFloat(match[1])
      const lat = Number.parseFloat(match[2])
      const content = match[3]

      if (Number.isNaN(lat) || Number.isNaN(lon)) continue

      if (trackPoints.length > 0) {
        const prev = trackPoints[trackPoints.length - 1]
        cumulativeDistance += haversineDistance(prev.latitude, prev.longitude, lat, lon)
      }

      const timeMatch = content.match(/<time>([^<]+)<\/time>/i)
      const timeStr = timeMatch ? timeMatch[1] : new Date().toISOString()

      let elevation: number | undefined
      const eleMatch = content.match(/<ele>([^<]+)<\/ele>/i)
      if (eleMatch) {
        const ele = Number.parseFloat(eleMatch[1])
        if (!Number.isNaN(ele)) elevation = ele
      }

      const hrMatch = content.match(/<(?:gpxtpx:|ns3:)?hr>(\d+)<\/(?:gpxtpx:|ns3:)?hr>/i)
      if (hrMatch) {
        const hr = Number.parseInt(hrMatch[1])
        if (!Number.isNaN(hr)) {
          heartRateData.push({ distance: cumulativeDistance, heartRate: hr })
        }
      }

      trackPoints.push({
        longitude: lon,
        latitude: lat,
        elevation,
        time: timeStr,
        distance: cumulativeDistance,
      })
    }
  }

  return { trackPoints, heartRateData }
}

// Worker message handler
self.onmessage = (event: MessageEvent<GpxWorkerInput>) => {
  try {
    const result = parseGpxInWorker(event.data.gpxString)
    self.postMessage(result)
  } catch (err) {
    const output: GpxWorkerOutput = {
      trackPoints: [],
      heartRateData: [],
      error: err instanceof Error ? err.message : 'Unknown worker error',
    }
    self.postMessage(output)
  }
}
