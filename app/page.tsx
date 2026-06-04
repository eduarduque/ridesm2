import { createClient } from '@/lib/supabase/server'
import FeedClient from '@/components/FeedClient'
import type { RideWithUser } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const cutoffIsNow = new Date(now.getTime() - 45 * 60 * 1000).toISOString()
  const todayStr = now.toISOString().split('T')[0]

  const { data: rides } = await supabase
    .from('rides')
    .select('*, users(id, name, rating, phone)')
    .in('status', ['open', 'filling'])
    // Drop "right now" posts older than 45 min
    .or(`is_now.eq.false,created_at.gte.${cutoffIsNow}`)
    // Drop rides with a departure date in the past
    .or(`is_now.eq.true,depart_date.is.null,depart_date.gte.${todayStr}`)
    .order('created_at', { ascending: false })
    .limit(100)

  let requestedRideIds: string[] = []
  if (user) {
    const { data: requests } = await supabase
      .from('match_requests')
      .select('ride_id')
      .eq('requester_id', user.id)
    requestedRideIds = requests?.map((r) => r.ride_id) ?? []
  }

  return (
    <FeedClient
      initialRides={(rides ?? []) as RideWithUser[]}
      userId={user?.id ?? null}
      requestedRideIds={requestedRideIds}
    />
  )
}
