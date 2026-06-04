'use client'

import { useState, useEffect } from 'react'
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

  const openCount = visible.length

  return (
    <div className="flex flex-col min-h-screen feed-mesh">
      <header className="px-4 pt-5 pb-3 bg-white/70 backdrop-blur-sm border-b border-slate-200/50">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Ride<span className="text-brand">SM</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              SM · Austin · Dallas corridor
            </p>
          </div>
          {openCount > 0 && (
            <span className="shrink-0 text-[11px] font-semibold text-brand bg-brand-light px-2.5 py-1 rounded-full">
              {openCount} live
            </span>
          )}
        </div>
      </header>

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

      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 pb-24 px-6">
          <div className="w-16 h-16 rounded-2xl bg-white card-lift flex items-center justify-center text-3xl">
            🚗
          </div>
          <p className="text-sm font-medium text-slate-600">No rides match your filters</p>
          <p className="text-xs text-center">Be the first — tap + to post a ride</p>
        </div>
      ) : (
        <div className="px-3 py-3 grid grid-cols-2 gap-2.5 pb-28 sm:px-4 sm:gap-3">
          {visible.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              userId={userId}
              hasRequested={requested.has(ride.id) || requesting === ride.id}
              onRequest={handleRequest}
            />
          ))}
        </div>
      )}

      <p className="text-center text-[10px] text-slate-400 px-6 py-3 pb-8">
        RideSM is a free community board. Not affiliated with TXST. Use at your own risk.
      </p>
    </div>
  )
}
