import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ChatClient from '@/components/ChatClient'
import type { Message } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ rideId: string; userId: string }>
}

export default async function ChatPage({ params }: Props) {
  const { rideId, userId: otherUserId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ride } = await supabase
    .from('rides')
    .select('from_city, to_city, user_id')
    .eq('id', rideId)
    .single()

  if (!ride) notFound()

  // Fetch other user's profile
  const { data: otherUser } = await supabase
    .from('users')
    .select('id, name, rating')
    .eq('id', otherUserId)
    .single()

  if (!otherUser) notFound()

  // Fetch existing messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('ride_id', rideId)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  return (
    <ChatClient
      rideId={rideId}
      otherUser={otherUser}
      currentUserId={user.id}
      initialMessages={(messages ?? []) as Message[]}
      rideLabel={`${ride.from_city} → ${ride.to_city}`}
    />
  )
}
