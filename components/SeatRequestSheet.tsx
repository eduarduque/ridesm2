'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RideWithUser } from '@/lib/types'

interface Props {
  ride: RideWithUser
  userId: string
  onSuccess: (rideId: string) => void
  onClose: () => void
}

export default function SeatRequestSheet({ ride, userId, onSuccess, onClose }: Props) {
  const maxSeats = Math.min(4, Math.max(1, ride.seats))
  const [seats, setSeats] = useState(1)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleRequest() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error: reqErr } = await supabase.from('match_requests').insert({
      ride_id: ride.id,
      requester_id: userId,
      seats_requested: seats,
    })

    if (reqErr) {
      setError(reqErr.message)
      setLoading(false)
      return
    }

    // Seed the chat with context so the driver knows what's coming
    const msgBody = `Requesting ${seats} seat${seats !== 1 ? 's' : ''}${note.trim() ? ` — ${note.trim()}` : ''}`
    await supabase.from('messages').insert({
      ride_id: ride.id,
      sender_id: userId,
      receiver_id: ride.user_id,
      body: msgBody,
    })

    onSuccess(ride.id)
    router.push(`/messages/${ride.id}/${ride.user_id}`)
  }

  const isOffer = ride.type === 'offer'
  const accentClass = isOffer ? 'bg-brand text-white border-brand' : 'bg-accent text-white border-accent'
  const ringClass = isOffer ? 'focus:ring-brand' : 'focus:ring-accent'

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl shadow-xl">
        <div className="px-4 pt-3 pb-3 border-b border-neutral-100">
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-neutral-900 text-base">Request seats</h2>
              <p className="text-xs text-neutral-400 mt-0.5">{ride.from_city} → {ride.to_city}</p>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-sm font-semibold cursor-pointer">
              Cancel
            </button>
          </div>
        </div>

        <div className="px-4 py-5 space-y-5">
          {/* Seat picker */}
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">How many seats?</p>
            <div className="flex gap-2">
              {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setSeats(n)}
                  className={`w-12 h-12 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer ${
                    seats === n ? accentClass : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <div className="flex items-center ml-2">
                <span className="text-xs text-neutral-400 font-medium">
                  of {ride.seats} available
                </span>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Note <span className="font-normal lowercase text-neutral-400">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 100))}
              placeholder="e.g. me and my roommate, leaving from dorm"
              className={`w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringClass}`}
            />
            <p className="text-[10px] text-neutral-400 text-right mt-0.5">{note.length}/100</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg">{error}</div>
          )}

          <button
            onClick={handleRequest}
            disabled={loading}
            className={`w-full font-bold py-3 rounded-xl disabled:opacity-50 transition-colors cursor-pointer text-white ${isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:bg-teal-700'}`}
          >
            {loading ? 'Sending…' : `Request ${seats} seat${seats !== 1 ? 's' : ''} & open chat`}
          </button>
        </div>
      </div>
    </div>
  )
}
