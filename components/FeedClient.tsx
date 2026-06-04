'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { RideWithUser } from '@/lib/types'
import FilterChips from './FilterChips'
import RideCard from './RideCard'
import { todayISO, tomorrowISO } from '@/lib/utils'

interface Props {
  initialRides: RideWithUser[]
  userId: string | null
  requestedRideIds: string[]
}

export default function FeedClient({ initialRides, userId, requestedRideIds }: Props) {
  const [rides, setRides] = useState<RideWithUser[]>(initialRides)
  const [requested, setRequested] = useState(new Set(requestedRideIds))
  const [routeFilter, setRouteFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [luggageFilter, setLuggageFilter] = useState(false)
  const [commutesFilter, setCommutesFilter] = useState(false)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [devRole, setDevRole] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('devRole')
    if (saved) applyRole(saved)

    function handleRoleChange(e: Event) {
      applyRole((e as CustomEvent).detail)
    }
    window.addEventListener('devRoleChange', handleRoleChange)
    return () => window.removeEventListener('devRoleChange', handleRoleChange)
  }, [])

  function applyRole(role: string) {
    setDevRole(role)
    if (role === 'customer') setTypeFilter('offer')
    else if (role === 'driver') setTypeFilter('request')
    else setTypeFilter('all')
  }

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('rides-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('rides')
              .select('*, users(id, name, rating, phone)')
              .eq('id', (payload.new as { id: string }).id)
              .single()
            if (data) setRides((prev) => [data as RideWithUser, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setRides((prev) =>
              prev.map((r) =>
                r.id === (payload.new as { id: string }).id ? { ...r, ...(payload.new as RideWithUser) } : r
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setRides((prev) => prev.filter((r) => r.id !== (payload.old as { id: string }).id))
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleRequest(rideId: string) {
    if (!userId) { window.location.href = '/login'; return }
    setRequesting(rideId)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.from('match_requests').insert({
      ride_id: rideId,
      requester_id: userId,
    })
    if (error) {
      setError(error.message)
    } else {
      setRequested((prev) => new Set([...prev, rideId]))
    }
    setRequesting(null)
  }

  const today = todayISO()
  const tomorrow = tomorrowISO()

  const sorted = [...rides].sort((a, b) => {
    if (a.is_now && !b.is_now) return -1
    if (!a.is_now && b.is_now) return 1
    if (a.is_now && b.is_now) return 0
    if (!a.depart_date && !b.depart_date) return 0
    if (!a.depart_date) return 1
    if (!b.depart_date) return -1
    const aKey = `${a.depart_date}T${a.depart_time_start ?? '23:59'}`
    const bKey = `${b.depart_date}T${b.depart_time_start ?? '23:59'}`
    return aKey.localeCompare(bKey)
  })

  const visible = sorted.filter((ride) => {
    if (ride.status !== 'open' && ride.status !== 'filling') return false

    // Client-side expiry: today's rides where the set departure time has passed
    if (!ride.is_now && ride.depart_date === today && ride.depart_time_start) {
      const departure = new Date(`${ride.depart_date}T${ride.depart_time_start}`)
      if (departure < new Date()) return false
    }

    if (typeFilter !== 'all' && ride.type !== typeFilter) return false
    if (luggageFilter && !ride.has_luggage_space) return false
    if (commutesFilter && !ride.is_recurring) return false

    if (routeFilter !== 'all') {
      const [from, to] = routeFilter.split('→')
      if (ride.from_city !== from || ride.to_city !== to) return false
    }

    if (timeFilter === 'urgent') return ride.is_now
    if (timeFilter === 'today') return ride.is_now || ride.depart_date === today
    if (timeFilter === 'tomorrow') return ride.depart_date === tomorrow

    return true
  })

  const offerRides = visible.filter((r) => r.type === 'offer')
  const requestRides = visible.filter((r) => r.type === 'request')
  const openCount = visible.length
  const showSplit = typeFilter === 'all'

  function renderCards(list: typeof visible) {
    return list.map((ride) => (
      <RideCard
        key={ride.id}
        ride={ride}
        userId={devRole && devRole !== 'admin' ? 'simulated-other-user' : userId}
        hasRequested={requested.has(ride.id) || requesting === ride.id}
        onRequest={handleRequest}
      />
    ))
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200/50">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-brand">
              RideSM
            </h1>
            <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">
              Community Carpool Board
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {openCount > 0 && (
              <span className="text-[9px] font-black text-white bg-brand px-2.5 py-1 rounded-full uppercase tracking-wider">
                {openCount} active
              </span>
            )}
            <Link
              href="/feedback"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-neutral-200 text-[10px] font-semibold text-neutral-500 hover:border-brand hover:text-brand transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              Feedback
            </Link>
          </div>
        </div>
      </header>

      {devRole && devRole !== 'admin' && (
        <div className={`border-b text-xs font-bold px-4 py-2 flex items-center gap-2 ${devRole === 'customer' ? 'bg-brand/10 text-brand border-brand/20' : 'bg-accent/10 text-accent border-accent/20'}`}>
          <span>{devRole === 'customer' ? '🙋 Customer view — browsing available rides' : '🚗 Driver view — seeing who needs a ride'}</span>
          <span className="ml-auto font-normal opacity-60">dev only</span>
        </div>
      )}

      <div className="max-w-md w-full mx-auto">
        <FilterChips
          routeFilter={routeFilter}
          onRouteChange={setRouteFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          timeFilter={timeFilter}
          onTimeChange={setTimeFilter}
          luggageFilter={luggageFilter}
          onLuggageChange={setLuggageFilter}
          commutesFilter={commutesFilter}
          onCommutesChange={setCommutesFilter}
        />
      </div>

      {error && (
        <div className="max-w-md mx-auto w-full px-4 mt-3">
          <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-100">
            {error}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-400 pb-24 px-6 mt-10">
          <div className="w-16 h-16 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-3xl shadow-sm">
            🚗
          </div>
          <p className="text-sm font-semibold text-neutral-700">No rides match your filters</p>
          <p className="text-xs text-neutral-400">Be the first — tap Post to share a ride</p>
        </div>
      ) : showSplit ? (
        <div className="px-4 pb-32 max-w-md mx-auto w-full space-y-6 pt-4">
          {offerRides.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-black text-brand uppercase tracking-wider">🚗 Available Rides</span>
                <span className="text-[10px] font-bold text-white bg-brand px-2 py-0.5 rounded-full">{offerRides.length}</span>
              </div>
              <div className="flex flex-col gap-3.5">{renderCards(offerRides)}</div>
            </section>
          )}
          {requestRides.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-black text-accent uppercase tracking-wider">🙋 Looking for a Ride</span>
                <span className="text-[10px] font-bold text-white bg-accent px-2 py-0.5 rounded-full">{requestRides.length}</span>
              </div>
              <div className="flex flex-col gap-3.5">{renderCards(requestRides)}</div>
            </section>
          )}
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-3.5 pb-32 max-w-md mx-auto w-full">
          {renderCards(visible)}
        </div>
      )}

      <div className="max-w-md mx-auto w-full pb-8">
        <p className="text-center text-[10px] text-neutral-400 px-6">
          RideSM is a free community board. Not affiliated with any organization. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
