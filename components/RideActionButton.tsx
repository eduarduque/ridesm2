'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RideWithUser } from '@/lib/types'
import Link from 'next/link'

interface Props {
  ride: RideWithUser
  userId: string | null
  hasRequested: boolean
}

export default function RideActionButton({ ride, userId, hasRequested: initialHasRequested }: Props) {
  const [hasRequested, setHasRequested] = useState(initialHasRequested)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const isOwn = ride.user_id === userId
  const canAct = !isOwn && (ride.status === 'open' || ride.status === 'filling')
  const isOffer = ride.type === 'offer'

  async function handleRequest() {
    if (!userId) { router.push('/login'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.from('match_requests').insert({
      ride_id: ride.id,
      requester_id: userId,
    })
    if (error) {
      setError(error.message)
    } else {
      setHasRequested(true)
    }
    setLoading(false)
  }

  if (!userId) {
    return (
      <Link
        href="/login"
        className={`block w-full text-center text-white font-bold py-4 rounded-lg transition-colors cursor-pointer ${
          isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:bg-teal-700'
        }`}
      >
        Sign in to respond
      </Link>
    )
  }

  if (isOwn) {
    return (
      <div className="w-full text-center py-4 bg-neutral-100 text-neutral-500 text-sm font-semibold rounded-lg">
        This is your ride
      </div>
    )
  }

  if (hasRequested) {
    return (
      <div className="w-full text-center py-4 bg-emerald-50 text-emerald-800 text-sm font-bold rounded-lg border border-emerald-200">
        ✓ Request sent — wait for the driver to accept
      </div>
    )
  }

  if (!canAct) {
    return (
      <div className="w-full text-center py-4 bg-neutral-100 text-neutral-400 text-sm font-semibold rounded-lg">
        Ride is {ride.status}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleRequest}
        disabled={loading}
        className={`w-full text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${
          isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:bg-teal-700'
        }`}
      >
        {loading
          ? 'Sending…'
          : isOffer
          ? 'Request seat'
          : 'I can take you'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2 text-center font-semibold">{error}</p>}
    </>
  )
}
