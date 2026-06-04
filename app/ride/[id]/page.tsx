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
    <div className="min-h-screen bg-white pb-32 max-w-md mx-auto w-full border-x border-neutral-100">
      <div className="px-4 pt-6 pb-4">
        <Link href="/" className="text-brand text-xs font-bold mb-5 inline-flex items-center gap-1 hover:underline cursor-pointer">
          ← Back to Feed
        </Link>

        {/* Route + badge */}
        <div className="flex items-start justify-between gap-3 mb-5 mt-2">
          <h1 className="text-2xl font-black text-neutral-900 leading-tight">
            {r.from_city} → {r.to_city}
          </h1>
          <div className="shrink-0">
            <StatusBadge status={r.status} />
          </div>
        </div>

        {/* Details card */}
        <div className="bg-neutral-50 rounded-xl border border-neutral-200/50 p-4 divide-y divide-neutral-200/40 mb-6">
          <div className="flex justify-between text-sm pb-2.5">
            <span className="text-neutral-500 font-medium">Type</span>
            <span className="font-bold text-neutral-900 capitalize">{r.type === 'offer' ? '🚗 Ride offer' : '🙋 Ride request'}</span>
          </div>
          <div className="flex justify-between text-sm py-2.5">
            <span className="text-neutral-500 font-medium">When</span>
            <span className="font-bold text-neutral-900">
              {r.is_now ? '🟢 Right now' : r.depart_date ? formatDate(r.depart_date, r.depart_time_start) : 'TBD'}
            </span>
          </div>
          {r.type === 'offer' && (
            <div className="flex justify-between text-sm py-2.5">
              <span className="text-neutral-500 font-medium">Seats</span>
              <span className="font-bold text-neutral-900">{r.seats} available</span>
            </div>
          )}
          {r.note && (
            <div className="flex flex-col gap-1 text-sm pt-2.5">
              <span className="text-neutral-500 font-medium">Note</span>
              <span className="text-neutral-800 bg-white p-3 rounded-lg border border-neutral-200/50 italic text-xs leading-relaxed">
                &ldquo;{r.note}&rdquo;
              </span>
            </div>
          )}
        </div>

        {/* Poster */}
        <div className="flex items-center gap-3.5 mb-6 bg-neutral-50/50 p-3 rounded-xl border border-neutral-100">
          <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center text-brand text-lg font-bold shrink-0">
            {(r.users?.name ?? '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-neutral-900">{r.users?.name ?? 'Anonymous'}</p>
            <p className="text-xs text-amber-500 flex items-center gap-1 mt-0.5 font-medium">
              {stars(r.users?.rating ?? 5)}{' '}
              <span className="text-neutral-400 font-semibold">{(r.users?.rating ?? 5).toFixed(1)} rating</span>
            </p>
          </div>
        </div>

        {/* Action */}
        <RideActionButton
          ride={r}
          userId={user?.id ?? null}
          hasRequested={hasRequested}
        />

        <p className="text-center text-[10px] text-neutral-400 mt-8 font-medium">
          RideSM is a free community board. Not affiliated with any organization. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
