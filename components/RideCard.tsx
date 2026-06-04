'use client'

import type { RideWithUser } from '@/lib/types'
import { formatTime, formatDayLabel } from '@/lib/utils'

interface Props {
  ride: RideWithUser
  userId: string | null
}

export default function RideCard({ ride, userId }: Props) {
  const isOwn = ride.user_id === userId
  const isOffer = ride.type === 'offer'
  const phone = ride.users?.phone
  const accentColor = isOffer ? 'border-l-brand' : 'border-l-accent'

  const timeStr = ride.is_now
    ? 'Right now'
    : ride.depart_time_start
    ? formatTime(ride.depart_time_start)
    : ''
  const dayStr = ride.is_now
    ? ''
    : ride.depart_date
    ? formatDayLabel(ride.depart_date)
    : ''

  return (
    <div className={`bg-white border border-neutral-200/70 border-l-4 ${accentColor} rounded-xl px-3.5 py-3 space-y-2`}>
      {/* Route */}
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-base font-bold text-neutral-900 leading-tight">
          {ride.from_city} → {ride.to_city}
        </p>
        <p className={`text-base font-bold shrink-0 leading-tight ${ride.is_now ? 'text-red-500' : isOffer ? 'text-brand' : 'text-accent'}`}>
          {timeStr}
        </p>
      </div>

      {/* Day */}
      {dayStr && (
        <p className="text-xs text-neutral-400 font-medium -mt-1">{dayStr}</p>
      )}

      {/* Note */}
      {ride.note && (
        <p className="text-xs text-neutral-500 italic line-clamp-2">{ride.note}</p>
      )}

      {/* Actions */}
      {isOwn ? (
        <p className="text-xs text-neutral-400">Your post</p>
      ) : phone ? (
        <div className="flex gap-2 pt-0.5">
          <a
            href={`sms:${phone}`}
            className={`flex-1 text-center py-2 rounded-lg text-xs font-bold text-white transition-colors ${isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:bg-teal-700'}`}
          >
            Message
          </a>
          <a
            href={`tel:${phone}`}
            className="px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50 transition-colors"
          >
            Call
          </a>
        </div>
      ) : (
        <p className="text-xs text-neutral-300">No contact info</p>
      )}
    </div>
  )
}
