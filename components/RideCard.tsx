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

export default function RideCard({ ride, userId, hasRequested, onRequest }: Props) {
  const isOwn = ride.user_id === userId
  const canAct = userId && !isOwn && (ride.status === 'open' || ride.status === 'filling')

  const actionLabel = hasRequested
    ? 'Requested ✓'
    : ride.type === 'offer'
    ? 'Request seat'
    : 'I can take you'

  const isOffer = ride.type === 'offer'

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
      {/* Color accent strip */}
      <div className={`h-1 w-full ${isOffer ? 'bg-brand' : 'bg-amber-400'}`} />

      <div className="p-4">
        {/* Type pill + route */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5 ${
              isOffer ? 'bg-brand-light text-brand' : 'bg-amber-50 text-amber-700'
            }`}>
              {isOffer ? '🚗 Offering ride' : '🙋 Needs ride'}
            </span>
            <Link href={`/ride/${ride.id}`}>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                {ride.from_city} → {ride.to_city}
              </h2>
            </Link>
          </div>
          <StatusBadge status={ride.status} />
        </div>

        {/* Date + seats */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>
            {ride.is_now
              ? '🟢 Right now'
              : ride.depart_date
              ? formatDate(ride.depart_date, ride.depart_time_start)
              : 'Date TBD'}
          </span>
          {isOffer && (
            <>
              <span className="text-gray-300">·</span>
              <span>{ride.seats} seat{ride.seats !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>

        {/* Note */}
        {ride.note && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 bg-gray-50 rounded-lg px-3 py-2">
            {ride.note}
          </p>
        )}

        {/* Footer: poster + action */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-brand-light flex items-center justify-center text-brand text-xs font-bold shrink-0">
              {(ride.users?.name ?? '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">
                {ride.users?.name ?? 'Anonymous'}
              </p>
              <p className="text-[10px] text-gray-400">{timeAgo(ride.created_at)}</p>
            </div>
          </div>

          {isOwn ? (
            <span className="text-xs text-gray-400 font-medium">Your ride</span>
          ) : !userId ? (
            <Link
              href="/login"
              className="text-xs bg-brand text-white px-4 py-2 rounded-full font-semibold"
            >
              Sign in
            </Link>
          ) : (
            <button
              disabled={hasRequested || !canAct}
              onClick={() => onRequest(ride.id)}
              className={`text-xs px-4 py-2 rounded-full font-semibold transition-colors ${
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
    </div>
  )
}
