'use client'

import Link from 'next/link'
import type { RideWithUser } from '@/lib/types'
import { formatDate, timeAgo } from '@/lib/utils'

interface Props {
  ride: RideWithUser
  userId: string | null
  hasRequested: boolean
  onRequest: (rideId: string) => void
}

function statusLabel(ride: RideWithUser): { text: string; variant: 'open' | 'filling' | 'closed' } {
  if (ride.status === 'matched' || ride.status === 'expired' || ride.status === 'cancelled') {
    return { text: ride.status.toUpperCase(), variant: 'closed' }
  }
  if (ride.status === 'filling') {
    return {
      text: ride.type === 'offer' ? `FILLING (${ride.seats} seats)` : 'FILLING',
      variant: 'filling',
    }
  }
  if (ride.type === 'offer') {
    return { text: `AVAILABLE (${ride.seats} seat${ride.seats !== 1 ? 's' : ''})`, variant: 'open' }
  }
  return { text: 'OPEN (1 person)', variant: 'open' }
}

function Avatar({ name, isOffer }: { name: string | null | undefined; isOffer: boolean }) {
  const initial = (name ?? '?')[0].toUpperCase()
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm ${isOffer ? 'bg-brand' : 'bg-accent'}`}>
      {initial}
    </div>
  )
}

export default function RideCard({ ride, userId, hasRequested, onRequest }: Props) {
  const isOwn = ride.user_id === userId
  const canAct = userId && !isOwn && (ride.status === 'open' || ride.status === 'filling')
  const isOffer = ride.type === 'offer'
  const isUrgent = ride.is_now
  const status = statusLabel(ride)
  const posterName = ride.users?.name ?? 'Anonymous'
  const ratingValue = ride.users?.rating ?? 5.0
  const phone = ride.users?.phone

  const borderClass = isOffer
    ? 'border-l-4 border-l-brand'
    : 'border-l-4 border-l-accent'

  const typeTagClass = isOffer
    ? 'bg-brand-light text-brand'
    : 'bg-accent-light text-accent'

  const statusTagClass =
    status.variant === 'open'
      ? 'bg-emerald-50 text-emerald-800'
      : status.variant === 'filling'
      ? 'bg-amber-50 text-amber-800'
      : 'bg-neutral-100 text-neutral-600'

  function handleReport(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const subject = encodeURIComponent(`RideSM Report — ride ${ride.id}`)
    const body = encodeURIComponent(
      `I would like to report ride ${ride.id} (${ride.from_city} → ${ride.to_city}).\n\nReason:\n`
    )
    window.location.href = `mailto:support@ridesm.app?subject=${subject}&body=${body}`
  }

  function renderAction() {
    if (isOwn) {
      return (
        <div className="w-full text-center py-2.5 bg-neutral-100 text-neutral-500 text-xs font-semibold rounded-lg">
          Your post
        </div>
      )
    }
    if (!userId) {
      return (
        <Link
          href="/login"
          className={`block w-full text-center py-2.5 rounded-lg text-xs font-bold text-white shadow-sm transition-colors cursor-pointer ${
            isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:bg-teal-700'
          }`}
        >
          Sign in to respond
        </Link>
      )
    }
    if (ride.status === 'matched' || ride.status === 'expired' || ride.status === 'cancelled') {
      return (
        <div className="w-full text-center py-2.5 bg-neutral-100 text-neutral-400 text-xs font-semibold rounded-lg">
          Closed
        </div>
      )
    }
    if (hasRequested) {
      return (
        <div className="w-full text-center py-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
          ✓ Request sent
        </div>
      )
    }
    if (!canAct) {
      return (
        <div className="w-full text-center py-2.5 bg-neutral-100 text-neutral-400 text-xs font-semibold rounded-lg">
          Unavailable
        </div>
      )
    }

    if (!isOffer && phone) {
      return (
        <a
          href={`tel:${phone}`}
          className="block w-full text-center py-2.5 rounded-lg text-xs font-bold text-white bg-accent hover:bg-teal-700 transition-colors shadow-sm cursor-pointer"
        >
          Call Requestor
        </a>
      )
    }

    return (
      <button
        onClick={() => onRequest(ride.id)}
        className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-sm transition-colors cursor-pointer ${
          isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:bg-teal-700'
        }`}
      >
        {isOffer ? 'Join Ride' : "I'll Drive"}
      </button>
    )
  }

  // Format departure label
  const departureLabel = isUrgent
    ? '🔴 ASAP (Urgent)'
    : ride.depart_date
    ? `${formatDate(ride.depart_date, ride.depart_time_start)}`
    : 'TBD'

  return (
    <div className={`bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between card-lift ${borderClass} ${isUrgent ? 'ring-1 ring-red-500/10' : ''}`}>
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <Avatar name={posterName} isOffer={isOffer} />
          <div>
            <div className="text-xs font-bold text-neutral-950 leading-tight">{posterName}</div>
            <div className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5 font-medium">
              <span className="text-amber-500">★</span>
              <span className="font-semibold text-neutral-700">{ratingValue.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${typeTagClass}`}>
            {isOffer ? 'Offering ride' : 'Requesting ride'}
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusTagClass}`}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Visual Timeline Details */}
      <Link href={`/ride/${ride.id}`} className="block py-4 group cursor-pointer">
        <div className="flex gap-4">
          {/* Vertical timeline graphic */}
          <div className="flex flex-col items-center justify-between py-1 shrink-0">
            <div className={`w-2 h-2 rounded-full border-2 bg-white group-hover:bg-current transition-colors ${isOffer ? 'border-brand text-brand' : 'border-accent text-accent'}`} />
            <div className="w-[1.5px] bg-neutral-300 grow my-1 min-h-[24px]" />
            <div className={`w-2 h-2 rounded-sm ${isOffer ? 'bg-brand' : 'bg-accent'}`} />
          </div>
          {/* Route cities */}
          <div className="flex flex-col justify-between grow py-0.5">
            <div className="text-sm font-bold text-neutral-950 group-hover:text-black transition-colors leading-none">
              {ride.from_city}
            </div>
            <div className="h-4" />
            <div className="text-sm font-bold text-neutral-950 group-hover:text-black transition-colors leading-none">
              {ride.to_city}
            </div>
          </div>
        </div>

        {/* Details row */}
        <div className="mt-3.5 space-y-1.5 text-xs text-neutral-600">
          <div className="flex justify-between items-baseline">
            <span className="text-neutral-500">Departure</span>
            <span className="font-semibold text-neutral-900">{departureLabel}</span>
          </div>
          {isOffer && (
            <div className="flex justify-between items-baseline">
              <span className="text-neutral-500">Seats</span>
              <span className="font-semibold text-neutral-900">{ride.seats} available</span>
            </div>
          )}
          {ride.note && (
            <p className="text-neutral-500 italic mt-2 text-[11px] line-clamp-2 leading-relaxed bg-neutral-50 p-2 rounded-lg border border-neutral-100/50">
              &ldquo;{ride.note}&rdquo;
            </p>
          )}
        </div>

        {/* Badges */}
        {(ride.is_recurring || ride.has_luggage_space) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {ride.is_recurring && (
              <span className="text-[9px] font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded">
                🔄 Commute
              </span>
            )}
            {ride.has_luggage_space && (
              <span className="text-[9px] font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded">
                🧳 Luggage
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Button Actions */}
      <div className="pt-2 border-t border-neutral-100 space-y-2.5">
        {renderAction()}
        <div className="flex items-center justify-between px-0.5">
          <button
            type="button"
            onClick={handleReport}
            className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors font-medium cursor-pointer"
          >
            <span>🚩</span> Report
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400">{timeAgo(ride.created_at)}</span>
            <span className="text-neutral-300">·</span>
            <Link
              href={`/ride/${ride.id}`}
              className={`text-[10px] font-bold hover:underline ${isOffer ? 'text-brand' : 'text-accent'}`}
            >
              Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
