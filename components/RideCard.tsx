'use client'

import Link from 'next/link'
import type { RideWithUser } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface Props {
  ride: RideWithUser
  userId: string | null
  hasRequested: boolean
  onRequest: (rideId: string) => void
}

function statusEmoji(status: string, isNow: boolean): string {
  if (isNow) return '🔥'
  if (status === 'open') return '🟢'
  if (status === 'filling') return '🟡'
  return '🔴'
}

function timeLabel(ride: RideWithUser): string {
  if (ride.is_now) return 'Right Now'
  if (!ride.depart_date) return 'Date TBD'
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (ride.depart_date === today) {
    if (!ride.depart_time_start) return 'Today'
    const [h, m] = ride.depart_time_start.split(':').map(Number)
    const p = h >= 12 ? 'PM' : 'AM'
    return `Today, ${h % 12 || 12}:${m.toString().padStart(2, '0')} ${p}`
  }
  if (ride.depart_date === tomorrow) {
    if (!ride.depart_time_start) return 'Tomorrow'
    const [h, m] = ride.depart_time_start.split(':').map(Number)
    const p = h >= 12 ? 'PM' : 'AM'
    return `Tomorrow, ${h % 12 || 12}:${m.toString().padStart(2, '0')} ${p}`
  }
  return formatDate(ride.depart_date, ride.depart_time_start)
}

function routeLabel(ride: RideWithUser): string {
  if (ride.from_city === ride.to_city) return `Within ${ride.from_city}`
  return `${ride.from_city} → ${ride.to_city}`
}

export default function RideCard({ ride, userId, hasRequested, onRequest }: Props) {
  const isOwn = ride.user_id === userId
  const canAct = userId && !isOwn && (ride.status === 'open' || ride.status === 'filling')
  const isOffer = ride.type === 'offer'
  const isUrgent = ride.is_now

  const actionLabel = hasRequested
    ? '✓ Sent'
    : isOffer ? 'Join Ride' : "I'll Drive"

  const seatsLabel = isOffer
    ? `💺 ${ride.seats} left`
    : '👤 1 person'

  return (
    <div className={`bg-white rounded-xl overflow-hidden border transition-shadow ${
      isUrgent
        ? 'border-orange-300 shadow-md shadow-orange-100'
        : 'border-gray-100 shadow-sm'
    }`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status + type column */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 w-6 text-center">
          <span className="text-base leading-none">{statusEmoji(ride.status, isUrgent)}</span>
          <span className="text-sm leading-none">{isOffer ? '🚗' : '🙋'}</span>
        </div>

        {/* Route + meta */}
        <Link href={`/ride/${ride.id}`} className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-snug truncate ${isUrgent ? 'text-orange-700' : 'text-gray-900'}`}>
            {routeLabel(ride)}
          </p>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {timeLabel(ride)}
            <span className="mx-1.5 text-gray-300">·</span>
            {seatsLabel}
            {ride.users?.name && (
              <><span className="mx-1.5 text-gray-300">·</span>{ride.users.name}</>
            )}
          </p>
        </Link>

        {/* Action */}
        <div className="shrink-0">
          {isOwn ? (
            <span className="text-xs text-gray-400 font-medium">Yours</span>
          ) : !userId ? (
            <Link href="/login" className="text-xs bg-brand text-white px-3 py-1.5 rounded-full font-semibold">
              Sign in
            </Link>
          ) : ride.status === 'matched' || ride.status === 'expired' || ride.status === 'cancelled' ? (
            <span className="text-xs text-gray-300 font-medium">Closed</span>
          ) : (
            <button
              disabled={hasRequested || !canAct}
              onClick={() => onRequest(ride.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                hasRequested
                  ? 'bg-green-100 text-green-700'
                  : canAct
                  ? isUrgent
                    ? 'bg-orange-500 text-white'
                    : 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-300'
              }`}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      {/* Tags: recurring, luggage — only if present */}
      {(ride.is_recurring || ride.has_luggage_space) && (
        <div className="flex gap-2 px-4 pb-2.5">
          {ride.is_recurring && (
            <span className="text-[10px] font-semibold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
              🔄 {ride.recurring_days?.join(' · ')}
            </span>
          )}
          {ride.has_luggage_space && (
            <span className="text-[10px] font-semibold bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
              🧳 Luggage OK
            </span>
          )}
        </div>
      )}
    </div>
  )
}
