'use client'

import Link from 'next/link'
import type { RideWithUser } from '@/lib/types'
import { formatDate, timeAgo } from '@/lib/utils'

interface Props {
  ride: RideWithUser
  userId: string | null
  hasRequested: boolean
  onRequest: (rideId: string) => void
  devMode?: boolean
  devRole?: string
}

function statusLabel(ride: RideWithUser): { text: string; variant: 'open' | 'filling' | 'closed' } {
  if (ride.status === 'matched' || ride.status === 'expired' || ride.status === 'cancelled') {
    return { text: ride.status.toUpperCase(), variant: 'closed' }
  }
  if (ride.status === 'filling') return { text: 'FILLING', variant: 'filling' }
  if (ride.type === 'offer') return { text: 'AVAILABLE', variant: 'open' }
  return { text: 'OPEN', variant: 'open' }
}

function SeatDots({ seats }: { seats: number }) {
  const MAX = 5
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: MAX }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border-2 transition-colors ${
            i < seats ? 'bg-brand border-brand' : 'bg-white border-neutral-300'
          }`}
        />
      ))}
      <span className="text-xs text-neutral-500 font-semibold ml-1">
        {seats} spot{seats !== 1 ? 's' : ''} left
      </span>
    </div>
  )
}

export default function RideCard({ ride, userId, hasRequested, onRequest, devMode, devRole }: Props) {
  const isOwn = !devMode && ride.user_id === userId
  const canAct = userId && !isOwn && (ride.status === 'open' || ride.status === 'filling')
  const isOffer = ride.type === 'offer'
  const isUrgent = ride.is_now
  const status = statusLabel(ride)
  const posterName = ride.users?.name ?? 'Anonymous'
  const phone = ride.users?.phone

  const accentColor = isOffer ? 'border-l-brand' : 'border-l-accent'
  const typeTagClass = isOffer ? 'bg-brand-light text-brand' : 'bg-accent-light text-accent'
  const statusTagClass =
    status.variant === 'open' ? 'bg-emerald-50 text-emerald-800' :
    status.variant === 'filling' ? 'bg-amber-50 text-amber-800' :
    'bg-neutral-100 text-neutral-600'

  const departureLabel = isUrgent
    ? '🔴 Right now — ASAP'
    : ride.depart_date
    ? formatDate(ride.depart_date, ride.depart_time_start)
    : 'Date TBD'

  function renderAction() {
    if (isOwn) return (
      <div className="w-full text-center py-3 bg-neutral-100 text-neutral-500 text-sm font-semibold rounded-xl">
        Your post
      </div>
    )
    if (!userId) return (
      <Link href="/login" className={`block w-full text-center py-3 rounded-xl text-sm font-bold text-white shadow-sm transition-colors ${isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:bg-teal-700'}`}>
        Sign in to respond
      </Link>
    )
    if (ride.status === 'matched' || ride.status === 'expired' || ride.status === 'cancelled') return (
      <div className="w-full text-center py-3 bg-neutral-100 text-neutral-400 text-sm font-semibold rounded-xl">
        Closed
      </div>
    )

    const msgLabel =
      devRole === 'customer' ? (isOffer ? 'Message driver' : 'Join request') :
      devRole === 'driver'   ? (isOffer ? 'Offer a seat'   : 'Message rider') :
      'Message'

    return (
      <div className="flex gap-2">
        <Link
          href={`/messages/${ride.id}/${ride.user_id}`}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-sm transition-colors ${isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:bg-teal-700'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          {msgLabel}
        </Link>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="px-4 py-3 rounded-xl border border-neutral-200 text-neutral-500 text-sm hover:bg-neutral-50 transition-colors flex items-center"
            title="Call"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
          </a>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white border border-neutral-200/80 border-l-4 ${accentColor} rounded-xl overflow-hidden card-lift ${isUrgent ? 'ring-1 ring-red-400/20' : ''}`}>
      <div className="p-4 space-y-3">

        {/* Row 1: tiny type + status tags */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${typeTagClass}`}>
            {isOffer ? 'Offering ride' : 'Requesting ride'}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusTagClass}`}>
            {status.text}
          </span>
        </div>

        {/* Row 2: ROUTE — hero element */}
        <Link href={`/ride/${ride.id}`} className="block group">
          <div className="flex gap-3">
            {/* Timeline graphic */}
            <div className="flex flex-col items-center shrink-0 pt-1">
              <div className={`w-2.5 h-2.5 rounded-full border-2 bg-white ${isOffer ? 'border-brand' : 'border-accent'}`} />
              <div className="w-px bg-neutral-200 grow my-1.5 min-h-[20px]" />
              <div className={`w-2.5 h-2.5 rounded-sm ${isOffer ? 'bg-brand' : 'bg-accent'}`} />
            </div>
            {/* Cities — big and bold */}
            <div className="flex flex-col justify-between gap-3">
              <span className="text-lg font-extrabold text-neutral-950 leading-none group-hover:text-black">
                {ride.from_city}
              </span>
              <span className="text-lg font-extrabold text-neutral-950 leading-none group-hover:text-black">
                {ride.to_city}
              </span>
            </div>
          </div>
        </Link>

        {/* Row 3: Date — prominent */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isUrgent ? 'bg-red-50' : 'bg-neutral-50'}`}>
          <span className="text-base">🕒</span>
          <span className={`text-sm font-bold ${isUrgent ? 'text-red-700' : 'text-neutral-800'}`}>
            {departureLabel}
          </span>
        </div>

        {/* Row 4: Seats dots (offers only) */}
        {isOffer && <SeatDots seats={ride.seats} />}

        {/* Row 5: Note */}
        {ride.note && (
          <p className="text-xs text-neutral-500 italic line-clamp-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-100">
            &ldquo;{ride.note}&rdquo;
          </p>
        )}

        {/* Row 6: Badges */}
        {(ride.is_recurring || ride.has_luggage_space) && (
          <div className="flex flex-wrap gap-1.5">
            {ride.is_recurring && (
              <span className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                🔄 Recurring
              </span>
            )}
            {ride.has_luggage_space && (
              <span className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                🧳 Luggage OK
              </span>
            )}
          </div>
        )}

        {/* Row 7: Action button */}
        {renderAction()}

        {/* Row 8: Footer — name is small context, not the point */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${isOffer ? 'bg-brand' : 'bg-accent'}`}>
              {posterName[0].toUpperCase()}
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">{posterName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400">{timeAgo(ride.created_at)}</span>
            <span className="text-neutral-300">·</span>
            <Link href={`/ride/${ride.id}`} className={`text-[10px] font-bold hover:underline ${isOffer ? 'text-brand' : 'text-accent'}`}>
              Details →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
