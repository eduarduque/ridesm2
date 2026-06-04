'use client'

import Link from 'next/link'
import type { RideWithUser } from '@/lib/types'
import StatusBadge from './StatusBadge'
import { timeAgo, formatDate } from '@/lib/utils'

interface Props {
  ride: RideWithUser
  userId: string | null
  hasRequested: boolean
  onRequest: (rideId: string) => void
}

function timeDisplay(ride: RideWithUser): string {
  if (ride.is_now) return 'Right now'
  if (!ride.depart_date) return 'Date TBD'
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (ride.depart_date === today) {
    return ride.depart_time_start
      ? `Today, ${formatTime(ride.depart_time_start)}`
      : 'Today'
  }
  if (ride.depart_date === tomorrow) {
    return ride.depart_time_start
      ? `Tomorrow, ${formatTime(ride.depart_time_start)}`
      : 'Tomorrow'
  }
  return formatDate(ride.depart_date, ride.depart_time_start)
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export default function RideCard({ ride, userId, hasRequested, onRequest }: Props) {
  const isOwn = ride.user_id === userId
  const canAct = userId && !isOwn && (ride.status === 'open' || ride.status === 'filling')
  const isOffer = ride.type === 'offer'

  const actionLabel = hasRequested ? 'Requested ✓' : isOffer ? 'Join Ride' : "I'll Drive"

  const isUrgent = ride.is_now
  const withinTown = ride.from_city === ride.to_city

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${
      isUrgent ? 'border-orange-400 shadow-orange-100 shadow-md' : 'border-gray-100'
    }`}>
      {/* Top row: type badge + status */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
          isOffer
            ? 'bg-brand-light text-brand'
            : 'bg-blue-50 text-blue-600'
        }`}>
          <span>{isOffer ? '🟢' : '🔵'}</span>
          {isOffer ? 'Offering Ride' : 'Requesting Ride'}
        </span>
        <StatusBadge status={ride.status} />
      </div>

      {/* Route — hero */}
      <Link href={`/ride/${ride.id}`} className="block px-4 pt-2 pb-1">
        <h2 className="text-[17px] font-extrabold text-gray-900 leading-snug">
          {withinTown
            ? `📍 Within ${ride.from_city}`
            : <>{ride.from_city}<span className="text-brand mx-1.5">→</span>{ride.to_city}</>
          }
        </h2>
      </Link>

      {/* Time */}
      <div className="px-4 pb-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
          🕒 <span className="font-medium">{timeDisplay(ride)}</span>
        </span>
      </div>

      {/* Tags row: recurring + luggage */}
      {(ride.is_recurring || ride.has_luggage_space) && (
        <div className="flex gap-2 px-4 pb-2">
          {ride.is_recurring && (
            <span className="text-[10px] font-semibold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
              🔄 Recurring · {ride.recurring_days?.join(', ')}
            </span>
          )}
          {ride.has_luggage_space && (
            <span className="text-[10px] font-semibold bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
              🧳 Luggage OK
            </span>
          )}
        </div>
      )}

      {/* Note */}
      {ride.note && (
        <div className="mx-4 mb-3 px-3 py-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 line-clamp-1">{ride.note}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-brand-light flex items-center justify-center text-brand text-xs font-bold shrink-0">
            {(ride.users?.name ?? '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">
              {ride.users?.name ?? 'Anonymous'}
            </p>
            <p className="text-[10px] text-gray-400">{timeAgo(ride.created_at)}</p>
          </div>
          {isOffer && (
            <span className="ml-1 text-xs text-gray-500 shrink-0">
              👥 {ride.seats} seat{ride.seats !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isOwn ? (
          <span className="text-xs text-gray-400 font-medium shrink-0">Your ride</span>
        ) : !userId ? (
          <Link
            href="/login"
            className="text-xs bg-brand text-white px-4 py-2 rounded-full font-semibold shrink-0"
          >
            Sign in
          </Link>
        ) : (
          <button
            disabled={hasRequested || !canAct}
            onClick={() => onRequest(ride.id)}
            className={`text-xs px-4 py-2 rounded-full font-semibold transition-colors shrink-0 ${
              hasRequested
                ? 'bg-green-100 text-green-700'
                : canAct
                ? 'bg-brand text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
