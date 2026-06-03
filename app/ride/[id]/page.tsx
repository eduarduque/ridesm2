import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, stars } from '@/lib/utils'
import type { RideWithUser } from '@/lib/types'
import RideActionButton from '@/components/RideActionButton'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RideDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: ride } = await supabase
    .from('rides')
    .select('*, users(id, name, rating, phone)')
    .eq('id', id)
    .single()

  if (!ride) notFound()

  const r = ride as RideWithUser

  let hasRequested = false
  if (user) {
    const { data } = await supabase
      .from('match_requests')
      .select('id')
      .eq('ride_id', id)
      .eq('requester_id', user.id)
      .single()
    hasRequested = !!data
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="px-4 pt-6 pb-4">
        <Link href="/" className="text-brand text-sm font-medium mb-4 inline-block">← Feed</Link>

        {/* Route + badge */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {r.from_city} → {r.to_city}
          </h1>
          <StatusBadge status={r.status} />
        </div>

        {/* Details card */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Type</span>
            <span className="font-medium capitalize">{r.type === 'offer' ? '🚗 Ride offer' : '🙋 Ride request'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">When</span>
            <span className="font-medium">
              {r.is_now ? '🟢 Right now' : r.depart_date ? formatDate(r.depart_date, r.depart_time_start) : 'TBD'}
            </span>
          </div>
          {r.type === 'offer' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Seats</span>
              <span className="font-medium">{r.seats}</span>
            </div>
          )}
          {r.note && (
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">Note</span>
              <span className="text-gray-800">{r.note}</span>
            </div>
          )}
        </div>

        {/* Poster */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center text-brand text-lg font-bold">
            {(r.users?.name ?? '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{r.users?.name ?? 'Anonymous'}</p>
            <p className="text-sm text-amber-500">
              {stars(r.users?.rating ?? 5)}{' '}
              <span className="text-gray-400 text-xs">{(r.users?.rating ?? 5).toFixed(1)} rating</span>
            </p>
          </div>
        </div>

        {/* Action */}
        <RideActionButton
          ride={r}
          userId={user?.id ?? null}
          hasRequested={hasRequested}
        />

        <p className="text-center text-[11px] text-gray-300 mt-6">
          RideSM is a free community board. Not affiliated with TXST. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
