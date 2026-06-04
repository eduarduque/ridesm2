'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { RideWithUser, MatchRequestWithDetails } from '@/lib/types'
import StatusBadge from './StatusBadge'
import { formatDate, stars, timeAgo } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Props {
  rides: RideWithUser[]
  requests: MatchRequestWithDetails[]
  userId: string
}

export default function MyRidesClient({ rides: initialRides, requests: initialRequests, userId }: Props) {
  const [tab, setTab] = useState<'posts' | 'requests'>('posts')
  const [rides, setRides] = useState(initialRides)
  const [requests, setRequests] = useState(initialRequests)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function cancelRide(rideId: string) {
    setLoading(rideId)
    const supabase = createClient()
    await supabase.from('rides').update({ status: 'cancelled' }).eq('id', rideId)
    setRides((prev) => prev.map((r) => (r.id === rideId ? { ...r, status: 'cancelled' } : r)))
    setLoading(null)
  }

  async function respondRequest(reqId: string, status: 'accepted' | 'declined') {
    setLoading(reqId)
    const supabase = createClient()
    await supabase.from('match_requests').update({ status }).eq('id', reqId)
    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status } : r))
    )
    setLoading(null)
    if (status === 'accepted') router.refresh()
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-white pb-32 max-w-md mx-auto w-full border-x border-neutral-100">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-neutral-900">Activity</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 px-4">
        <button
          onClick={() => setTab('posts')}
          className={`pb-3 mr-6 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            tab === 'posts'
              ? 'border-brand text-brand'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          My Posts
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            tab === 'requests'
              ? 'border-brand text-brand'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          Requests
          {pendingCount > 0 && (
            <span className="bg-brand text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'posts' && (
        <div className="divide-y divide-neutral-100">
          {rides.length === 0 && (
            <div className="py-16 text-center text-neutral-400 text-sm">
              <p className="text-3xl mb-3">🚗</p>
              <p>You haven&apos;t posted any rides yet.</p>
              <Link href="/post" className="text-brand font-semibold text-sm mt-2 inline-block hover:underline">
                Post a ride →
              </Link>
            </div>
          )}
          {rides.map((ride) => (
            <div key={ride.id} className="px-4 py-5 hover:bg-neutral-50/50 transition-colors">
              <div className="flex items-start justify-between mb-1.5">
                <h3 className="font-bold text-neutral-900 text-[15px]">
                  {ride.from_city} → {ride.to_city}
                </h3>
                <StatusBadge status={ride.status} />
              </div>
              <p className="text-xs text-neutral-500 mb-1">
                {ride.is_now ? '🟢 Right now' : formatDate(ride.depart_date, ride.depart_time_start)}
                {' · '}{ride.seats} seat{ride.seats !== 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-neutral-400">{timeAgo(ride.created_at)}</p>
              {ride.note && (
                <p className="text-xs text-neutral-600 mt-2 bg-neutral-50 p-2 rounded border border-neutral-100 italic">
                  &ldquo;{ride.note}&rdquo;
                </p>
              )}
              {(ride.status === 'open' || ride.status === 'filling') && (
                <button
                  onClick={() => cancelRide(ride.id)}
                  disabled={loading === ride.id}
                  className="mt-3 text-xs text-red-600 font-semibold disabled:opacity-50 hover:underline cursor-pointer"
                >
                  {loading === ride.id ? 'Cancelling…' : 'Cancel ride'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'requests' && (
        <div className="divide-y divide-neutral-100">
          {requests.length === 0 && (
            <div className="py-16 text-center text-neutral-400 text-sm">
              <p className="text-3xl mb-3">📬</p>
              <p>No requests yet.</p>
            </div>
          )}
          {requests.map((req) => (
            <div key={req.id} className="px-4 py-5 hover:bg-neutral-50/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-sm shrink-0">
                  {(req.users?.name ?? '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-neutral-900 text-sm">
                    {req.users?.name ?? 'Anonymous'}
                  </p>
                  <p className="text-[11px] text-amber-500 flex items-center gap-0.5">
                    {stars(req.users?.rating ?? 5)}{' '}
                    <span className="text-neutral-400 font-medium">{(req.users?.rating ?? 5).toFixed(1)}</span>
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs font-bold text-neutral-900">
                    {req.rides?.from_city} → {req.rides?.to_city}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{timeAgo(req.created_at)}</p>
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => respondRequest(req.id, 'accepted')}
                    disabled={loading === req.id}
                    className="flex-1 py-2 bg-brand text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer hover:bg-brand-dark transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondRequest(req.id, 'declined')}
                    disabled={loading === req.id}
                    className="flex-1 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer hover:bg-neutral-200 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              )}

              {req.status === 'accepted' && (
                <Link
                  href={`/messages/${req.ride_id}/${req.requester_id}`}
                  className="mt-2 block text-center py-2 bg-brand-light text-brand hover:bg-brand-light/70 transition-colors text-xs font-bold rounded-lg"
                >
                  Message {req.users?.name ?? 'them'} →
                </Link>
              )}

              {req.status === 'declined' && (
                <p className="text-xs text-neutral-400 mt-1 font-medium">Request declined</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
