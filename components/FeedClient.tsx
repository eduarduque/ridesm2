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

  // Sort: urgent first → soonest departure → TBD last
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

    if (routeFilter !== 'all') {
      const [from, to] = routeFilter.split('→')
      if (ride.from_city !== from || ride.to_city !== to) return false
    }

    if (timeFilter === 'urgent') return ride.is_now
    if (timeFilter === 'today') return ride.is_now || ride.depart_date === today
    if (timeFilter === 'tomorrow') return ride.depart_date === tomorrow

    return true
  })

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="px-4 pt-6 pb-2 bg-white border-b border-gray-100">
        <h1 className="text-xl font-bold text-brand">RideSM</h1>
        <p className="text-xs text-gray-400">SM · Austin · Dallas corridor</p>
      </div>

      <FilterChips
        routeFilter={routeFilter}
        onRouteChange={setRouteFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        timeFilter={timeFilter}
        onTimeChange={setTimeFilter}
        luggageFilter={luggageFilter}
        onLuggageChange={setLuggageFilter}
      />

      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
      )}

      {visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 pb-20">
          <p className="text-4xl">🚗</p>
          <p className="text-sm">No rides match your filters</p>
          <p className="text-xs">Be the first — tap + to post</p>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3 pb-24">
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

      <div className="text-center text-[10px] text-gray-300 py-4 pb-6">
        RideSM is a free community board. Not affiliated with TXST. Use at your own risk.
      </div>
    </div>
  )
}
