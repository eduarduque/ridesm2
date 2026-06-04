'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CITIES, DAYS, DISCLAIMER } from '@/lib/constants'
import type { RideType } from '@/lib/types'
import Link from 'next/link'
import { todayISO, tomorrowISO } from '@/lib/utils'

type WhenOption = 'now' | 'today' | 'tomorrow' | 'pick'

export default function PostPage() {
  const [rideType, setRideType] = useState<RideType>('offer')
  const [fromCity, setFromCity] = useState('')
  const [fromCityCustom, setFromCityCustom] = useState('')
  const [toCity, setToCity] = useState('')
  const [toCityCustom, setToCityCustom] = useState('')
  const [whenOption, setWhenOption] = useState<WhenOption>('today')
  const [pickDate, setPickDate] = useState('')
  const [pickTime, setPickTime] = useState('')
  const [seats, setSeats] = useState(1)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDays, setRecurringDays] = useState<string[]>([])
  const [hasLuggageSpace, setHasLuggageSpace] = useState(false)
  const [note, setNote] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [needsTerms, setNeedsTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const resolvedFrom = fromCity === 'Other' ? fromCityCustom.trim() : fromCity
  const resolvedTo = toCity === 'Other' ? toCityCustom.trim() : toCity

  async function handleSubmit() {
    if (!resolvedFrom || !resolvedTo) { setError('Please select From and To cities.'); return }
    if (fromCity === 'Other' && !fromCityCustom.trim()) { setError('Please specify the "From" city.'); return }
    if (toCity === 'Other' && !toCityCustom.trim()) { setError('Please specify the "To" city.'); return }
    if (isRecurring && recurringDays.length === 0) { setError('Please select at least one day for the recurring ride.'); return }
    if (whenOption === 'pick' && !pickDate) { setError('Please pick a date.'); return }
    if (whenOption !== 'now' && !pickTime) { setError('Please add a departure time.'); return }
    if (needsTerms && !agreedTerms) { setError('Please agree to the terms to post.'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Check if first post
    const { data: profile } = await supabase
      .from('users')
      .select('agreed_terms_at')
      .eq('id', user.id)
      .single()

    if (!profile?.agreed_terms_at && !needsTerms) {
      setNeedsTerms(true)
      setLoading(false)
      return
    }

    if (needsTerms && agreedTerms) {
      await supabase
        .from('users')
        .update({ agreed_terms_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    const isNow = whenOption === 'now'
    const departDate =
      whenOption === 'today' ? todayISO()
      : whenOption === 'tomorrow' ? tomorrowISO()
      : whenOption === 'pick' ? pickDate
      : null

    const { error: insertError } = await supabase.from('rides').insert({
      user_id: user.id,
      type: rideType,
      from_city: resolvedFrom,
      to_city: resolvedTo,
      is_now: isNow,
      depart_date: isNow ? null : departDate,
      depart_time_start: isNow ? null : pickTime || null,
      seats,
      is_recurring: isRecurring,
      recurring_days: isRecurring ? recurringDays : [],
      has_luggage_space: hasLuggageSpace,
      note: note.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/my-rides')
    }
  }

  return (
    <div className="min-h-screen bg-white pb-32 max-w-md mx-auto w-full border-x border-neutral-100">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-100">
        <h1 className="text-xl font-bold text-neutral-900">Post a ride</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Step 1: Type toggle */}
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">I am…</p>
          <div className="flex rounded-lg overflow-hidden border border-neutral-200">
            <button
              onClick={() => setRideType('offer')}
              className={`flex-1 py-3 text-sm font-bold transition-colors cursor-pointer ${
                rideType === 'offer'
                  ? 'bg-brand text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              🚗 Offering a ride
            </button>
            <button
              onClick={() => setRideType('request')}
              className={`flex-1 py-3 text-sm font-bold transition-colors border-l border-neutral-200 cursor-pointer ${
                rideType === 'request'
                  ? 'bg-accent text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              🙋 Need a ride
            </button>
          </div>
        </div>

        {/* From / To */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">From</label>
            <select
              value={fromCity}
              onChange={(e) => { setFromCity(e.target.value); setFromCityCustom('') }}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            >
              <option value="">Select…</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {fromCity === 'Other' && (
              <input
                type="text"
                placeholder="City name"
                value={fromCityCustom}
                onChange={(e) => setFromCityCustom(e.target.value.slice(0, 50))}
                className="w-full mt-2 border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                autoFocus
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">To</label>
            <select
              value={toCity}
              onChange={(e) => { setToCity(e.target.value); setToCityCustom('') }}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            >
              <option value="">Select…</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {toCity === 'Other' && (
              <input
                type="text"
                placeholder="City name"
                value={toCityCustom}
                onChange={(e) => setToCityCustom(e.target.value.slice(0, 50))}
                className="w-full mt-2 border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            )}
          </div>
        </div>

        {/* When */}
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">When</p>
          <div className="grid grid-cols-2 gap-2">
            {(['now', 'today', 'tomorrow', 'pick'] as WhenOption[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setWhenOption(opt)}
                className={`py-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  whenOption === opt
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {opt === 'now' ? '🟢 Right now' : opt === 'today' ? 'Today' : opt === 'tomorrow' ? 'Tomorrow' : '📅 Pick date'}
              </button>
            ))}
          </div>
          {whenOption === 'pick' && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <input
                type="date"
                value={pickDate}
                min={todayISO()}
                onChange={(e) => setPickDate(e.target.value)}
                className="border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <input
                type="time"
                value={pickTime}
                onChange={(e) => setPickTime(e.target.value)}
                className="border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}
          {(whenOption === 'today' || whenOption === 'tomorrow') && (
            <div className="mt-3">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Departure time <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={pickTime}
                onChange={(e) => setPickTime(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}
        </div>

        {/* Seats */}
        {rideType === 'offer' && (
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Seats available</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSeats(n)}
                  className={`w-11 h-11 rounded-lg text-sm font-bold border transition-colors cursor-pointer ${
                    seats === n
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recurring */}
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Frequency</p>
          <div className="flex rounded-lg overflow-hidden border border-neutral-200">
            <button
              onClick={() => setIsRecurring(false)}
              className={`flex-1 py-3 text-sm font-bold transition-colors cursor-pointer ${!isRecurring ? 'bg-brand text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
            >
              One-time
            </button>
            <button
              onClick={() => setIsRecurring(true)}
              className={`flex-1 py-3 text-sm font-bold border-l border-neutral-200 transition-colors cursor-pointer ${isRecurring ? 'bg-brand text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
            >
              🔄 Recurring
            </button>
          </div>
          {isRecurring && (
            <div className="flex gap-2 flex-wrap mt-3">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() =>
                    setRecurringDays((prev) =>
                      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    recurringDays.includes(day)
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Luggage */}
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Luggage space</p>
          <div className="flex rounded-lg overflow-hidden border border-neutral-200">
            <button
              type="button"
              onClick={() => setHasLuggageSpace(false)}
              className={`flex-1 py-3 text-sm font-bold transition-colors cursor-pointer ${!hasLuggageSpace ? 'bg-brand text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => setHasLuggageSpace(true)}
              className={`flex-1 py-3 text-sm font-bold border-l border-neutral-200 transition-colors cursor-pointer ${hasLuggageSpace ? 'bg-brand text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
            >
              🧳 Yes
            </button>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Note <span className="text-neutral-400 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 140))}
            placeholder="e.g. leaving from the quad, can pickup along 35…"
            rows={3}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <p className="text-[10px] text-neutral-400 text-right font-medium mt-1">{note.length}/140</p>
        </div>

        {/* Terms checkbox (first post only) */}
        {needsTerms && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-neutral-700 mb-3 leading-relaxed font-medium">{DISCLAIMER}</p>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 accent-brand"
              />
              <span className="text-xs font-semibold text-neutral-700">
                I have read and agree to these terms.{' '}
                <Link href="/terms" target="_blank" className="text-brand underline font-bold">
                  Full terms
                </Link>
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-brand text-white font-bold py-4 rounded-lg disabled:opacity-50 hover:bg-brand-dark transition-colors cursor-pointer"
        >
          {loading ? 'Posting…' : 'Post ride'}
        </button>
      </div>
    </div>
  )
}
