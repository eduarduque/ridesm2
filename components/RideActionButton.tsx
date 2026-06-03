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
        className="block w-full text-center bg-brand text-white font-semibold py-4 rounded-xl"
      >
        Sign in to request
      </Link>
    )
  }

  if (isOwn) {
    return (
      <div className="w-full text-center py-4 bg-gray-100 text-gray-500 text-sm font-medium rounded-xl">
        This is your ride
      </div>
    )
  }

  if (hasRequested) {
    return (
      <div className="w-full text-center py-4 bg-green-100 text-green-700 text-sm font-medium rounded-xl">
        ✓ Request sent — wait for the driver to accept
      </div>
    )
  }

  if (!canAct) {
    return (
      <div className="w-full text-center py-4 bg-gray-100 text-gray-500 text-sm font-medium rounded-xl">
        Ride is {ride.status}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleRequest}
        disabled={loading}
        className="w-full bg-brand text-white font-semibold py-4 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
      >
        {loading
          ? 'Sending…'
          : ride.type === 'offer'
          ? 'Request seat'
          : 'I can take you'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </>
  )
}
