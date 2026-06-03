import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MyRidesClient from '@/components/MyRidesClient'
import type { RideWithUser, MatchRequestWithDetails } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MyRidesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [ridesResult, requestsResult] = await Promise.all([
    supabase
      .from('rides')
      .select('*, users(id, name, rating, phone)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('match_requests')
      .select('*, rides(*, users(id, name, rating, phone)), users(id, name, rating, phone)')
      .eq('rides.user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // Filter match requests to only those on the current user's rides
  const requests = (requestsResult.data ?? []).filter(
    (r) => r.rides?.user_id === user.id
  )

  return (
    <MyRidesClient
      rides={(ridesResult.data ?? []) as RideWithUser[]}
      requests={requests as MatchRequestWithDetails[]}
      userId={user.id}
    />
  )
}
