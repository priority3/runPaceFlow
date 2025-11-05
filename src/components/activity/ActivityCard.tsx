/**
 * ActivityCard Component
 *
 * Display activity information with play button for route animation
 */

'use client'

import { useSetAtom } from 'jotai'
import { Play } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDuration, formatPace } from '@/lib/pace/calculator'
import { formatDate, formatTime } from '@/lib/utils'
import { playingActivityIdAtom } from '@/stores/map'

export interface ActivityCardProps {
  id: string
  title: string
  type: string
  startTime: Date | number
  duration: number // seconds
  distance: number // meters
  averagePace?: number // seconds/km
  elevationGain?: number // meters
  onClick?: () => void
}

export function ActivityCard({
  id,
  title,
  type,
  startTime,
  duration,
  distance,
  averagePace,
  elevationGain,
  onClick,
}: ActivityCardProps) {
  const setPlayingActivityId = useSetAtom(playingActivityIdAtom)
  const router = useRouter()

  const handleCardClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Navigate to activity detail page
      router.push(`/activity/${id}`)
    }
  }

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPlayingActivityId(id)
  }

  const distanceKm = (distance / 1000).toFixed(2)
  const typeEmoji = type === 'running' ? '🏃' : type === 'cycling' ? '🚴' : '🚶'

  return (
    <Card className="hover:bg-fill/50 cursor-pointer transition-colors" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            {typeEmoji} {title}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handlePlay} className="text-blue hover:bg-blue/10 h-8 w-8">
            <Play className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-secondaryLabel text-sm">
          {formatDate(startTime)} {formatTime(startTime)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex flex-col">
            <span className="text-tertiaryLabel text-xs">距离</span>
            <span className="text-label text-lg font-semibold">{distanceKm} km</span>
          </div>
          <div className="flex flex-col">
            <span className="text-tertiaryLabel text-xs">时长</span>
            <span className="text-label text-lg font-semibold">{formatDuration(duration)}</span>
          </div>
          {averagePace && (
            <div className="flex flex-col">
              <span className="text-tertiaryLabel text-xs">配速</span>
              <span className="text-label text-lg font-semibold">{formatPace(averagePace)}</span>
            </div>
          )}
          {elevationGain !== undefined && elevationGain > 0 && (
            <div className="flex flex-col">
              <span className="text-tertiaryLabel text-xs">爬升</span>
              <span className="text-label text-lg font-semibold">{elevationGain.toFixed(0)} m</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
