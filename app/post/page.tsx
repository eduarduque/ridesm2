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
    <div className="min-h-screen pb-28">
      <div className="px-4 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Post a ride</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Step 1: Type toggle */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">I am…</p>
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button
              onClick={() => setRideType('offer')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                rideType === 'offer'
                  ? 'bg-brand text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              🚗 Offering a ride
            </button>
            <button
              onClick={() => setRideType('request')}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-l border-gray-200 ${
                rideType === 'request'
                  ? 'bg-brand text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              🙋 Need a ride
            </button>
          </div>
        </div>

        {/* From / To */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <select
              value={fromCity}
              onChange={(e) => { setFromCity(e.target.value); setFromCityCustom('') }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
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
                className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                autoFocus
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <select
              value={toCity}
              onChange={(e) => { setToCity(e.target.value); setToCityCustom('') }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
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
                className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            )}
          </div>
        </div>

        {/* When */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">When</p>
          <div className="grid grid-cols-2 gap-2">
            {(['now', 'today', 'tomorrow', 'pick'] as WhenOption[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setWhenOption(opt)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  whenOption === opt
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-600 border-gray-200'
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
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <input
                type="time"
                value={pickTime}
                onChange={(e) => setPickTime(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}
        </div>

        {/* Seats */}
        {rideType === 'offer' && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Seats available</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setSeats(n)}
                  className={`w-12 h-12 rounded-xl text-sm font-semibold border transition-colors ${
                    seats === n
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-gray-600 border-gray-200'
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
          <p className="text-sm font-medium text-gray-700 mb-2">Frequency</p>
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button
              onClick={() => setIsRecurring(false)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${!isRecurring ? 'bg-brand text-white' : 'bg-white text-gray-600'}`}
            >
              One-time
            </button>
            <button
              onClick={() => setIsRecurring(true)}
              className={`flex-1 py-3 text-sm font-medium border-l border-gray-200 transition-colors ${isRecurring ? 'bg-brand text-white' : 'bg-white text-gray-600'}`}
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
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    recurringDays.includes(day)
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-gray-600 border-gray-200'
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
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700">🧳 Space for luggage</p>
              <p className="text-xs text-gray-400">Check this if you can carry bags or boxes</p>
            </div>
            <button
              onClick={() => setHasLuggageSpace((v) => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative ${hasLuggageSpace ? 'bg-brand' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hasLuggageSpace ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 140))}
            placeholder="e.g. leaving from the quad, can pickup along 35…"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <p className="text-xs text-gray-400 text-right">{note.length}/140</p>
        </div>

        {/* Terms checkbox (first post only) */}
        {needsTerms && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">{DISCLAIMER}</p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 accent-brand"
              />
              <span className="text-sm text-gray-700">
                I have read and agree to these terms.{' '}
                <Link href="/terms" target="_blank" className="text-brand underline">
                  Full terms
                </Link>
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-brand text-white font-semibold py-4 rounded-xl disabled:opacity-50 hover:bg-brand-dark transition-colors"
        >
          {loading ? 'Posting…' : 'Post ride'}
        </button>
      </div>
    </div>
  )
}
