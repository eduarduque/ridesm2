import { createClient } from '@/lib/supabase/server'
import FeedClient from '@/components/FeedClient'
import type { RideWithUser } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: rides } = await supabase
    .from('rides')
    .select('*, users(id, name, rating, phone)')
    .in('status', ['open', 'filling'])
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
