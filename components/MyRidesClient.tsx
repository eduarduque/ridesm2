'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { RideWithUser, MatchRequestWithDetails } from '@/lib/types'
import StatusBadge from './StatusBadge'
import EditRideSheet from './EditRideSheet'
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
  const [devRole, setDevRole] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [editingRide, setEditingRide] = useState<RideWithUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('devRole')
    if (saved) setDevRole(saved)
    function handleRoleChange(e: Event) { setDevRole((e as CustomEvent).detail) }
    window.addEventListener('devRoleChange', handleRoleChange)
    return () => window.removeEventListener('devRoleChange', handleRoleChange)
  }, [])

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
    setRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status } : r)))

    if (status === 'accepted') {
      const req = requests.find((r) => r.id === reqId)
      if (req?.ride_id) {
        const currentRide = rides.find((r) => r.id === req.ride_id) ?? req.rides
        const newSeats = Math.max(0, currentRide.seats - 1)
        const newStatus = newSeats === 0 ? 'matched' : 'filling'
        await supabase.from('rides').update({ seats: newSeats, status: newStatus }).eq('id', req.ride_id)
        setRides((prev) =>
          prev.map((r) => r.id === req.ride_id ? { ...r, seats: newSeats, status: newStatus } : r)
        )
      }
      router.refresh()
    }
    setLoading(null)
  }

  async function markFull(rideId: string) {
    setLoading(rideId)
    const supabase = createClient()
    await supabase.from('rides').update({ status: 'matched', seats: 0 }).eq('id', rideId)
    setRides((prev) => prev.map((r) => r.id === rideId ? { ...r, status: 'matched', seats: 0 } : r))
    setLoading(null)
  }

  async function deleteRide(rideId: string) {
    setLoading(rideId)
    const supabase = createClient()
    await supabase.from('rides').delete().eq('id', rideId)
    setRides((prev) => prev.filter((r) => r.id !== rideId))
    setLoading(null)
  }

  async function deleteSelected() {
    if (selected.size === 0) return
    setDeleting(true)
    const ids = Array.from(selected)
    const supabase = createClient()
    await supabase.from('rides').delete().in('id', ids)
    setRides((prev) => prev.filter((r) => !ids.includes(r.id)))
    setSelected(new Set())
    setSelecting(false)
    setDeleting(false)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const postsLabel = devRole === 'driver' ? 'My Offers' : 'My Posts'
  const requestsLabel = devRole === 'driver' ? 'Incoming Requests' : 'Requests'

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
          {postsLabel}
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            tab === 'requests'
              ? 'border-brand text-brand'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          {requestsLabel}
          {pendingCount > 0 && (
            <span className="bg-brand text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'posts' && (
        <div>
          {/* Select mode toolbar */}
          {rides.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 bg-neutral-50/50">
              {selecting ? (
                <>
                  <span className="text-xs font-semibold text-neutral-500">
                    {selected.size} selected
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (selected.size === rides.length) setSelected(new Set())
                        else setSelected(new Set(rides.map((r) => r.id)))
                      }}
                      className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 cursor-pointer"
                    >
                      {selected.size === rides.length ? 'Deselect all' : 'Select all'}
                    </button>
                    <button
                      onClick={deleteSelected}
                      disabled={selected.size === 0 || deleting}
                      className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 px-3 py-1 rounded-full transition-colors cursor-pointer"
                    >
                      {deleting ? 'Deleting…' : `Delete ${selected.size > 0 ? selected.size : ''}`}
                    </button>
                    <button
                      onClick={() => { setSelecting(false); setSelected(new Set()) }}
                      className="text-xs font-semibold text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs text-neutral-400">{rides.length} post{rides.length !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setSelecting(true)}
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 cursor-pointer"
                  >
                    Select
                  </button>
                </>
              )}
            </div>
          )}

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
              <div
                key={ride.id}
                onClick={selecting ? () => toggleSelect(ride.id) : undefined}
                className={`px-4 py-4 transition-colors ${selecting ? 'cursor-pointer' : 'hover:bg-neutral-50/50'} ${selecting && selected.has(ride.id) ? 'bg-red-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {selecting && (
                    <div className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${selected.has(ride.id) ? 'bg-red-500 border-red-500' : 'border-neutral-300'}`}>
                      {selected.has(ride.id) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-neutral-900 text-[15px]">
                        {ride.from_city} → {ride.to_city}
                      </h3>
                      <StatusBadge status={ride.status} />
                    </div>
                    <p className="text-xs text-neutral-500 mb-0.5">
                      {ride.is_now ? '🟢 Right now' : formatDate(ride.depart_date, ride.depart_time_start)}
                      {' · '}{ride.seats} seat{ride.seats !== 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-neutral-400">{timeAgo(ride.created_at)}</p>
                    {ride.note && (
                      <p className="text-xs text-neutral-600 mt-1.5 bg-neutral-50 p-2 rounded border border-neutral-100 italic">
                        &ldquo;{ride.note}&rdquo;
                      </p>
                    )}
                    {!selecting && (
                      <div className="flex items-center gap-4 mt-2.5">
                        {(ride.status === 'open' || ride.status === 'filling') && (
                          <>
                            <button
                              onClick={() => cancelRide(ride.id)}
                              disabled={loading === ride.id}
                              className="text-xs text-red-600 font-semibold disabled:opacity-50 hover:underline cursor-pointer"
                            >
                              {loading === ride.id ? 'Updating…' : 'Cancel'}
                            </button>
                            <button
                              onClick={() => markFull(ride.id)}
                              disabled={loading === ride.id}
                              className="text-xs text-amber-600 font-semibold disabled:opacity-50 hover:underline cursor-pointer"
                            >
                              Mark as Full
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setEditingRide(ride)}
                          className="text-xs text-brand font-semibold hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRide(ride.id)}
                          disabled={loading === ride.id}
                          className="text-xs text-neutral-400 font-semibold disabled:opacity-50 hover:text-red-500 hover:underline cursor-pointer ml-auto"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingRide && (
        <EditRideSheet
          ride={editingRide}
          onSave={(updated) => {
            setRides((prev) => prev.map((r) => r.id === updated.id ? updated : r))
            setEditingRide(null)
          }}
          onClose={() => setEditingRide(null)}
        />
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
