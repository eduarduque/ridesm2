'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CITIES, DAYS } from '@/lib/constants'
import type { RideWithUser } from '@/lib/types'
import { todayISO, tomorrowISO } from '@/lib/utils'

type WhenOption = 'now' | 'today' | 'tomorrow' | 'pick'

interface Props {
  ride: RideWithUser
  onSave: (updated: RideWithUser) => void
  onClose: () => void
}

function inferWhen(ride: RideWithUser): WhenOption {
  if (ride.is_now) return 'now'
  if (ride.depart_date === todayISO()) return 'today'
  if (ride.depart_date === tomorrowISO()) return 'tomorrow'
  return 'pick'
}

function cityValue(city: string): string {
  return (CITIES as readonly string[]).includes(city) ? city : 'Other'
}

export default function EditRideSheet({ ride, onSave, onClose }: Props) {
  const [fromCity, setFromCity] = useState(cityValue(ride.from_city))
  const [fromCityCustom, setFromCityCustom] = useState((CITIES as readonly string[]).includes(ride.from_city) ? '' : ride.from_city)
  const [toCity, setToCity] = useState(cityValue(ride.to_city))
  const [toCityCustom, setToCityCustom] = useState((CITIES as readonly string[]).includes(ride.to_city) ? '' : ride.to_city)
  const [whenOption, setWhenOption] = useState<WhenOption>(inferWhen(ride))
  const [pickDate, setPickDate] = useState(ride.depart_date ?? '')
  const [pickTime, setPickTime] = useState(ride.depart_time_start ?? '')
  const [seats, setSeats] = useState(ride.seats)
  const [isRecurring, setIsRecurring] = useState(ride.is_recurring)
  const [recurringDays, setRecurringDays] = useState<string[]>(ride.recurring_days ?? [])
  const [hasLuggageSpace, setHasLuggageSpace] = useState(ride.has_luggage_space)
  const [note, setNote] = useState(ride.note ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const resolvedFrom = fromCity === 'Other' ? fromCityCustom.trim() : fromCity
  const resolvedTo = toCity === 'Other' ? toCityCustom.trim() : toCity

  async function handleSave() {
    if (!resolvedFrom || !resolvedTo) { setError('Please select From and To cities.'); return }
    if (fromCity === 'Other' && !fromCityCustom.trim()) { setError('Please specify the From city.'); return }
    if (toCity === 'Other' && !toCityCustom.trim()) { setError('Please specify the To city.'); return }
    if (isRecurring && recurringDays.length === 0) { setError('Please select at least one day.'); return }
    if (whenOption === 'pick' && !pickDate) { setError('Please pick a date.'); return }
    if (whenOption !== 'now' && !pickTime) { setError('Please add a departure time.'); return }

    setLoading(true)
    setError('')

    const isNow = whenOption === 'now'
    const departDate =
      whenOption === 'today' ? todayISO()
      : whenOption === 'tomorrow' ? tomorrowISO()
      : whenOption === 'pick' ? pickDate
      : null

    const patch = {
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
    }

    const supabase = createClient()
    const { error: updateError } = await supabase.from('rides').update(patch).eq('id', ride.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      onSave({ ...ride, ...patch } as RideWithUser)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-2xl max-h-[92dvh] flex flex-col shadow-xl">
        {/* Handle + header */}
        <div className="px-4 pt-3 pb-3 border-b border-neutral-100 shrink-0">
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-neutral-900 text-base">Edit ride</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-sm font-semibold cursor-pointer">
              Cancel
            </button>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5 pb-6">

          {/* From / To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">From</label>
              <select
                value={fromCity}
                onChange={(e) => { setFromCity(e.target.value); setFromCityCustom('') }}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
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
                  className="w-full mt-2 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">To</label>
              <select
                value={toCity}
                onChange={(e) => { setToCity(e.target.value); setToCityCustom('') }}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
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
                  className="w-full mt-2 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              )}
            </div>
          </div>

          {/* When */}
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">When</p>
            <div className="grid grid-cols-2 gap-2">
              {(['now', 'today', 'tomorrow', 'pick'] as WhenOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setWhenOption(opt)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
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
                  className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <input
                  type="time"
                  value={pickTime}
                  onChange={(e) => setPickTime(e.target.value)}
                  className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
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
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            )}
          </div>

          {/* Seats (offer only) */}
          {ride.type === 'offer' && (
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Seats available</p>
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
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Frequency</p>
            <div className="flex rounded-lg overflow-hidden border border-neutral-200">
              <button
                onClick={() => setIsRecurring(false)}
                className={`flex-1 py-2.5 text-sm font-bold transition-colors cursor-pointer ${!isRecurring ? 'bg-brand text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
              >
                One-time
              </button>
              <button
                onClick={() => setIsRecurring(true)}
                className={`flex-1 py-2.5 text-sm font-bold border-l border-neutral-200 transition-colors cursor-pointer ${isRecurring ? 'bg-brand text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
              >
                🔄 Recurring
              </button>
            </div>
            {isRecurring && (
              <div className="flex gap-2 flex-wrap mt-2">
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
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Luggage space</p>
            <div className="flex rounded-lg overflow-hidden border border-neutral-200">
              <button
                onClick={() => setHasLuggageSpace(false)}
                className={`flex-1 py-2.5 text-sm font-bold transition-colors cursor-pointer ${!hasLuggageSpace ? 'bg-brand text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
              >
                No
              </button>
              <button
                onClick={() => setHasLuggageSpace(true)}
                className={`flex-1 py-2.5 text-sm font-bold border-l border-neutral-200 transition-colors cursor-pointer ${hasLuggageSpace ? 'bg-brand text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
              >
                🧳 Yes
              </button>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              Note <span className="text-neutral-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 140))}
              placeholder="e.g. leaving from the quad…"
              rows={2}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <p className="text-[10px] text-neutral-400 text-right font-medium mt-0.5">{note.length}/140</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg">{error}</div>
          )}
        </div>

        {/* Save button */}
        <div className="px-4 pb-8 pt-3 border-t border-neutral-100 shrink-0">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-brand text-white font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-brand-dark transition-colors cursor-pointer"
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
