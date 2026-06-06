'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { RideWithUser } from '@/lib/types'
import FilterChips from './FilterChips'
import RideCard from './RideCard'
import { todayISO, tomorrowISO } from '@/lib/utils'

type MainTab = 'now' | 'offering' | 'requesting'

interface Props {
  initialRides: RideWithUser[]
  userId: string | null
}

export default function FeedClient({ initialRides, userId }: Props) {
  const [rides, setRides] = useState<RideWithUser[]>(initialRides)
  const [mainTab, setMainTab] = useState<MainTab>('offering')
  const [routeFilter, setRouteFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [luggageFilter, setLuggageFilter] = useState(false)
  const [commutesFilter, setCommutesFilter] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('rides-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const { data } = await supabase
            .from('rides')
            .select('*, users(id, name, rating, phone)')
            .eq('id', (payload.new as { id: string }).id)
            .single()
          if (data) setRides((prev) => [data as RideWithUser, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setRides((prev) =>
            prev.map((r) => r.id === (payload.new as { id: string }).id ? { ...r, ...(payload.new as RideWithUser) } : r)
          )
        } else if (payload.eventType === 'DELETE') {
          setRides((prev) => prev.filter((r) => r.id !== (payload.old as { id: string }).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const today = todayISO()
  const tomorrow = tomorrowISO()

  const sorted = [...rides].sort((a, b) => {
    if (a.is_now && !b.is_now) return -1
    if (!a.is_now && b.is_now) return 1
    if (!a.depart_date && !b.depart_date) return 0
    if (!a.depart_date) return 1
    if (!b.depart_date) return -1
    const aKey = `${a.depart_date}T${a.depart_time_start ?? '23:59'}`
    const bKey = `${b.depart_date}T${b.depart_time_start ?? '23:59'}`
    return aKey.localeCompare(bKey)
  })

  const visible = sorted.filter((ride) => {
    if (ride.status !== 'open' && ride.status !== 'filling') return false

    if (!ride.is_now && ride.depart_date === today && ride.depart_time_start) {
      const departure = new Date(`${ride.depart_date}T${ride.depart_time_start}`)
      if (departure < new Date()) return false
    }

    // Main tab filter
    if (mainTab === 'now' && !ride.is_now) return false
    if (mainTab === 'offering' && (ride.type !== 'offer' || ride.is_now)) return false
    if (mainTab === 'requesting' && (ride.type !== 'request' || ride.is_now)) return false

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

  const nowCount = sorted.filter(r => r.is_now && (r.status === 'open' || r.status === 'filling')).length

  const TABS: { key: MainTab; label: string }[] = [
    { key: 'now', label: 'Right Now' },
    { key: 'offering', label: 'Offering' },
    { key: 'requesting', label: 'Requesting' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="bg-foreground text-background">
        <div className="max-w-md mx-auto px-5 pt-6 pb-5 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-none">
              Ride<span className="text-brand">SM</span>
            </h1>
            <p className="text-[11px] text-background/50 font-semibold mt-1.5 uppercase tracking-widest">
              Community Carpool Board
            </p>
          </div>
          <div className="flex items-center gap-2">
            {nowCount > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-background bg-urgent px-2.5 py-1.5 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
                {nowCount} now
              </span>
            )}
            <Link
              href="/feedback"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-background/20 text-background/70 hover:bg-background/10 transition-colors"
              aria-label="Send feedback"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Main tabs */}
        <div className="max-w-md mx-auto px-5 pb-5">
          <div className="flex gap-1 p-1 rounded-full bg-background/10">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-bold rounded-full transition-all duration-150 cursor-pointer ${
                  mainTab === tab.key
                    ? 'bg-background text-foreground'
                    : 'text-background/60 hover:text-background'
                }`}
              >
                {tab.label}
                {tab.key === 'now' && nowCount > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${mainTab === tab.key ? 'bg-urgent text-background' : 'bg-urgent text-background'}`}>{nowCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-md w-full mx-auto">
        <FilterChips
          routeFilter={routeFilter}
          onRouteChange={setRouteFilter}
          typeFilter="all"
          onTypeChange={() => {}}
          timeFilter={timeFilter}
          onTimeChange={setTimeFilter}
          luggageFilter={luggageFilter}
          onLuggageChange={setLuggageFilter}
          commutesFilter={commutesFilter}
          onCommutesChange={setCommutesFilter}
        />
      </div>

      {/* Cards */}
      {visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-400 pb-24 px-6 mt-10">
          <div className="w-16 h-16 rounded-2xl bg-surface border-2 border-foreground flex items-center justify-center text-3xl shadow-pop">
            {mainTab === 'now' ? '⚡' : mainTab === 'offering' ? '🚗' : '🙋'}
          </div>
          <p className="text-base font-extrabold text-foreground">
            {mainTab === 'now' ? 'Nothing right now' : 'No rides posted yet'}
          </p>
          <p className="text-xs text-neutral-400 font-medium">Be the first — tap + to post</p>
        </div>
      ) : (
        <div className="px-4 pt-4 pb-32 max-w-md mx-auto w-full flex flex-col gap-3">
          {visible.map((ride) => (
            <RideCard key={ride.id} ride={ride} userId={userId} />
          ))}
        </div>
      )}

      <div className="max-w-md mx-auto w-full pb-8">
        <p className="text-center text-[10px] text-neutral-400 px-6 font-medium">
          RideSM is a free community board. Not affiliated with any organization. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
