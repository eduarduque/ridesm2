'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RideWithUser } from '@/lib/types'
import Link from 'next/link'
import SeatRequestSheet from './SeatRequestSheet'

interface Props {
  ride: RideWithUser
  userId: string | null
  hasRequested: boolean
}

export default function RideActionButton({ ride, userId, hasRequested: initialHasRequested }: Props) {
  const [hasRequested, setHasRequested] = useState(initialHasRequested)
  const [showSheet, setShowSheet] = useState(false)
  const router = useRouter()

  const isOwn = ride.user_id === userId
  const canAct = !isOwn && (ride.status === 'open' || ride.status === 'filling')
  const isOffer = ride.type === 'offer'

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
      <div className="flex gap-2">
        <div className="flex-1 text-center py-4 bg-emerald-50 text-emerald-800 text-sm font-bold rounded-lg border border-emerald-200">
          ✓ Request pending — waiting for response
        </div>
        <Link
          href={`/messages/${ride.id}/${ride.user_id}`}
          className={`px-4 py-4 rounded-lg text-sm font-bold text-white transition-colors ${isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:bg-teal-700'}`}
        >
          Chat
        </Link>
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
        onClick={() => setShowSheet(true)}
        className={`w-full text-white font-bold py-4 rounded-lg transition-colors cursor-pointer ${
          isOffer ? 'bg-brand hover:bg-brand-dark' : 'bg-accent hover:bg-teal-700'
        }`}
      >
        {isOffer ? 'Request seats' : 'Join request'}
      </button>

      {showSheet && (
        <SeatRequestSheet
          ride={ride}
          userId={userId}
          onSuccess={() => {
            setHasRequested(true)
            setShowSheet(false)
            router.push(`/messages/${ride.id}/${ride.user_id}`)
          }}
          onClose={() => setShowSheet(false)}
        />
      )}
    </>
  )
}
