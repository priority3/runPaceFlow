/**
 * useGpxParser Hook
 *
 * Parses GPX XML in a Web Worker to keep the main thread free.
 * Returns TrackPoints (with Date objects), heart rate data, and
 * a loading flag so the consumer can show a skeleton while parsing.
 */

'use client'

import { useEffect, useRef, useState } from 'react'

import type { GpxWorkerOutput } from '@/lib/map/gpx-worker'
import type { TrackPoint } from '@/lib/map/pace-utils'

export interface GpxParseResult {
  trackPoints: TrackPoint[]
  heartRateData: { distance: number; heartRate: number }[]
  isParsing: boolean
}

export function useGpxParser(gpxData: string | null | undefined): GpxParseResult {
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([])
  const [heartRateData, setHeartRateData] = useState<{ distance: number; heartRate: number }[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    if (!gpxData) {
      setTrackPoints([])
      setHeartRateData([])
      return
    }

    setIsParsing(true)

    // Reason: Create worker inline with new URL() so Next.js/webpack can
    // resolve the worker file and emit it as a separate chunk.
    const worker = new Worker(new URL('@/lib/map/gpx-worker.ts', import.meta.url))
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<GpxWorkerOutput>) => {
      const { trackPoints: rawPoints, heartRateData: hrData, error } = event.data

      if (error) {
        console.warn('[useGpxParser] Worker error:', error)
      }

      // Convert ISO time strings back to Date objects
      const points: TrackPoint[] = rawPoints.map((pt) => ({
        longitude: pt.longitude,
        latitude: pt.latitude,
        elevation: pt.elevation,
        time: new Date(pt.time),
        distance: pt.distance,
      }))

      setTrackPoints(points)
      setHeartRateData(hrData)
      setIsParsing(false)

      worker.terminate()
      workerRef.current = null
    }

    worker.onerror = (err) => {
      console.warn('[useGpxParser] Worker failed, falling back:', err)
      setIsParsing(false)
      worker.terminate()
      workerRef.current = null
    }

    worker.postMessage({ gpxString: gpxData })

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [gpxData])

  return { trackPoints, heartRateData, isParsing }
}
