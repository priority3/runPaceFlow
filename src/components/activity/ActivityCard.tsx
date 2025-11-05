/**
 * ActivityCard Component
 *
 * Display activity information with play button for route animation
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { formatDuration, formatPace } from '@/lib/pace/calculator'
import { useSetAtom } from 'jotai'
import { playingActivityIdAtom } from '@/stores/map'
import { useRouter } from 'next/navigation'

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
    <Card
      className="cursor-pointer transition-colors hover:bg-fill/50"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            {typeEmoji} {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlay}
            className="h-8 w-8 text-blue hover:bg-blue/10"
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-secondaryLabel">
          {formatDate(startTime)} {formatTime(startTime)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex flex-col">
            <span className="text-xs text-tertiaryLabel">距离</span>
            <span className="text-lg font-semibold text-label">{distanceKm} km</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-tertiaryLabel">时长</span>
            <span className="text-lg font-semibold text-label">{formatDuration(duration)}</span>
          </div>
          {averagePace && (
            <div className="flex flex-col">
              <span className="text-xs text-tertiaryLabel">配速</span>
              <span className="text-lg font-semibold text-label">{formatPace(averagePace)}</span>
            </div>
          )}
          {elevationGain !== undefined && elevationGain > 0 && (
            <div className="flex flex-col">
              <span className="text-xs text-tertiaryLabel">爬升</span>
              <span className="text-lg font-semibold text-label">{elevationGain.toFixed(0)} m</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
