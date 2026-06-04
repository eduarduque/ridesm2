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

function cardTitle(ride: RideWithUser): string {
  const route =
    ride.from_city === ride.to_city
      ? `Within ${ride.from_city.replace('San Marcos', 'SM')}`
      : `${ride.from_city.replace('San Marcos', 'SM')} → ${ride.to_city.replace('San Marcos', 'SM')}`

  if (ride.is_now && ride.type === 'request') {
    return `Need Urgent Ride ${ride.from_city === ride.to_city ? 'Within SM' : route}`
  }
  if (ride.type === 'offer') return `Ride Available ${route}`
  return `Ride Needed ${route}`
}

function routeDetail(ride: RideWithUser): string {
  if (ride.note) return ride.note
  const from = ride.from_city.replace('San Marcos', 'SM')
  const to = ride.to_city.replace('San Marcos', 'SM')
  if (ride.from_city === ride.to_city) return `${from} area`
  if (ride.is_now) return `${from} to ${to} (ASAP)`
  if (ride.depart_time_start) {
    const [h, m] = ride.depart_time_start.split(':').map(Number)
    const p = h >= 12 ? 'PM' : 'AM'
    const t = `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${p}`
    return `${from} to ${to} (${t})`
  }
  return `${from} to ${to}`
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

function Avatar({ name }: { name: string | null | undefined }) {
  const initial = (name ?? '?')[0].toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white shadow-sm">
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
  const phone = ride.users?.phone

  const borderColor = isUrgent
    ? 'border-t-urgent'
    : isOffer
    ? 'border-t-offer'
    : 'border-t-request'

  const typeTagClass = isOffer
    ? 'bg-offer-light text-offer'
    : 'bg-request-light text-request'

  const statusTagClass =
    status.variant === 'open'
      ? 'bg-emerald-50 text-emerald-700'
      : status.variant === 'filling'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-100 text-slate-500'

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
        <div className="w-full text-center py-2.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl">
          Your post
        </div>
      )
    }
    if (!userId) {
      return (
        <Link
          href="/login"
          onClick={(e) => e.stopPropagation()}
          className="block w-full text-center py-2.5 rounded-xl text-xs font-bold text-white bg-brand shadow-sm"
        >
          Sign in to respond
        </Link>
      )
    }
    if (ride.status === 'matched' || ride.status === 'expired' || ride.status === 'cancelled') {
      return (
        <div className="w-full text-center py-2.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl">
          Closed
        </div>
      )
    }
    if (hasRequested) {
      return (
        <div className="w-full text-center py-2.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
          ✓ Request sent
        </div>
      )
    }
    if (!canAct) {
      return (
        <div className="w-full text-center py-2.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl">
          Unavailable
        </div>
      )
    }

    if (!isOffer && phone) {
      return (
        <a
          href={`tel:${phone}`}
          onClick={(e) => e.stopPropagation()}
          className="block w-full text-center py-2.5 rounded-xl text-xs font-bold text-white bg-accent shadow-sm hover:bg-teal-700 transition-colors"
        >
          Call Requestor
        </a>
      )
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRequest(ride.id)
        }}
        className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-colors ${
          isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:bg-teal-700'
        }`}
      >
        {isOffer ? 'Join Ride' : "I'll Drive"}
      </button>
    )
  }

  return (
    <article
      className={`card-lift bg-surface rounded-2xl overflow-hidden border border-slate-200/80 border-t-4 ${borderColor} ${
        isUrgent ? 'urgent-pulse ring-1 ring-urgent/20' : ''
      }`}
    >
      <Link href={`/ride/${ride.id}`} className="block p-3 pb-2">
        <div className="flex items-center justify-between gap-1 mb-2">
          <span
            className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${typeTagClass}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {isOffer ? 'Offering ride' : 'Requesting ride'}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusTagClass}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {status.text}
          </span>
        </div>

        <h2 className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 mb-1">
          {cardTitle(ride)}
        </h2>

        <p className="text-[10px] text-slate-500 mb-0.5">
          <span className="text-slate-400">{timeAgo(ride.created_at)}</span>
          <span className="mx-1">·</span>
          {routeDetail(ride)}
        </p>

        {isUrgent && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-urgent">
            <span aria-hidden>⏱️</span>
            <span>Urgent ASAP</span>
          </div>
        )}

        {(ride.is_recurring || ride.has_luggage_space) && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {ride.is_recurring && (
              <span className="text-[9px] font-semibold bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full">
                🔄 Commute
              </span>
            )}
            {ride.has_luggage_space && (
              <span className="text-[9px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
                🧳 Luggage
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2.5">
          <Avatar name={ride.users?.name} />
          <span className="text-[11px] font-medium text-slate-700 truncate">{posterName}</span>
        </div>
      </Link>

      <div className="px-3 pb-3 space-y-2">
        {renderAction()}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleReport}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span aria-hidden>🚩</span>
            Report
          </button>
          <Link
            href={`/ride/${ride.id}`}
            className="text-[10px] text-brand font-medium hover:underline"
          >
            Details →
          </Link>
        </div>
      </div>
    </article>
  )
}
