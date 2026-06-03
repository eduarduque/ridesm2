'use client'

import Link from 'next/link'
import type { RideWithUser } from '@/lib/types'
import StatusBadge from './StatusBadge'
import { timeAgo, formatDate, stars } from '@/lib/utils'

interface Props {
  ride: RideWithUser
  userId: string | null
  hasRequested: boolean
  onRequest: (rideId: string) => void
}

export default function RideCard({ ride, userId, hasRequested, onRequest }: Props) {
  const isOwn = ride.user_id === userId
  const canAct = userId && !isOwn && (ride.status === 'open' || ride.status === 'filling')

  const actionLabel =
    hasRequested
      ? 'Requested ✓'
      : ride.type === 'offer'
      ? 'Request seat'
      : 'I can take you'

  return (
    <div className="px-4 py-4 bg-white">
      {/* Header: route + badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/ride/${ride.id}`} className="flex-1">
          <h2 className="text-base font-semibold text-gray-900 leading-tight">
            {ride.from_city} → {ride.to_city}
          </h2>
        </Link>
        <StatusBadge status={ride.status} />
      </div>

      {/* Date + seats row */}
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
        <span>
          {ride.is_now
            ? '🟢 Right now'
            : ride.depart_date
            ? formatDate(ride.depart_date, ride.depart_time_start)
            : 'Date TBD'}
        </span>
        <span>·</span>
        <span>{ride.seats} seat{ride.seats !== 1 ? 's' : ''}</span>
      </div>

      {/* Note */}
      {ride.note && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ride.note}</p>
      )}

      {/* Footer: poster + time + action */}
      <div className="flex items-center justify-between mt-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-brand-light flex items-center justify-center text-brand text-xs font-bold shrink-0">
            {(ride.users?.name ?? '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">
              {ride.users?.name ?? 'Anonymous'}
            </p>
            <p className="text-[10px] text-amber-500 leading-none">
              {stars(ride.users?.rating ?? 5)}{' '}
              <span className="text-gray-400">{(ride.users?.rating ?? 5).toFixed(1)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-gray-400">{timeAgo(ride.created_at)}</span>
          {isOwn ? (
            <span className="text-xs text-gray-400 font-medium">Your ride</span>
          ) : !userId ? (
            <Link
              href="/login"
              className="text-xs bg-brand text-white px-3 py-1.5 rounded-full font-medium"
            >
              Sign in
            </Link>
          ) : (
            <button
              disabled={hasRequested || !canAct}
              onClick={() => onRequest(ride.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                hasRequested
                  ? 'bg-green-100 text-green-700'
                  : canAct
                  ? 'bg-brand text-white hover:bg-brand-dark'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
