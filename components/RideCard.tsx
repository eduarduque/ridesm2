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

  const badge = ride.is_now
    ? { label: 'NOW', cls: 'bg-urgent text-white' }
    : isOffer
    ? { label: 'OFFERING', cls: 'bg-brand text-white' }
    : { label: 'REQUEST', cls: 'bg-accent text-white' }

  const accentBar = ride.is_now ? 'bg-urgent' : isOffer ? 'bg-brand' : 'bg-accent'
  const timeColor = ride.is_now ? 'text-urgent' : isOffer ? 'text-brand' : 'text-accent'

  return (
    <div className="card-lift relative bg-surface border border-neutral-200 rounded-2xl overflow-hidden">
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentBar}`} aria-hidden="true" />
      <div className="pl-5 pr-4 py-4 space-y-3">
        {/* Top row: badge + time */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-md ${badge.cls}`}>
            {badge.label}
          </span>
          <p className={`text-sm font-extrabold shrink-0 leading-none ${timeColor}`}>
            {timeStr}
          </p>
        </div>

        {/* Route */}
        <div className="flex items-center gap-2">
          <p className="text-xl font-black text-foreground leading-tight tracking-tight">
            {ride.from_city}
          </p>
          <svg className="w-4 h-4 text-neutral-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
          <p className="text-xl font-black text-foreground leading-tight tracking-tight">
            {ride.to_city}
          </p>
        </div>

        {/* Day */}
        {dayStr && (
          <p className="text-xs text-neutral-500 font-semibold -mt-1">{dayStr}</p>
        )}

        {/* Note */}
        {ride.note && (
          <p className="text-[13px] text-neutral-600 line-clamp-2 leading-relaxed">{ride.note}</p>
        )}

        {/* Actions */}
        {isOwn ? (
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide pt-0.5">Your post</p>
        ) : phone ? (
          <div className="flex gap-2 pt-1">
            <a
              href={`sms:${phone}`}
              className={`flex-1 text-center py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:opacity-90'}`}
            >
              Message
            </a>
            <a
              href={`tel:${phone}`}
              className="px-5 py-2.5 rounded-xl border-2 border-foreground text-foreground text-sm font-bold hover:bg-foreground hover:text-background transition-colors"
            >
              Call
            </a>
          </div>
        ) : (
          <p className="text-xs text-neutral-300 font-medium">No contact info</p>
        )}
      </div>
    </div>
  )
}
