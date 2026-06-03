import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Message } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Conversation {
  rideId: string
  otherUserId: string
  otherUserName: string
  rideLabel: string
  lastMessage: string
  lastTime: string
  unread: number
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:sender_id(id, name), receiver:receiver_id(id, name), rides(from_city, to_city)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Group into conversations
  const convMap = new Map<string, Conversation>()

  for (const msg of (messages ?? []) as (Message & {
    sender: { id: string; name: string | null }
    receiver: { id: string; name: string | null }
    rides: { from_city: string; to_city: string } | null
  })[]) {
    const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
    const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender
    const key = `${msg.ride_id}:${otherId}`

    if (!convMap.has(key)) {
      convMap.set(key, {
        rideId: msg.ride_id,
        otherUserId: otherId,
        otherUserName: otherUser?.name ?? 'Anonymous',
        rideLabel: msg.rides ? `${msg.rides.from_city} → ${msg.rides.to_city}` : 'Ride',
        lastMessage: msg.body,
        lastTime: msg.created_at,
        unread: 0,
      })
    }

    if (msg.receiver_id === user.id && !msg.read_at) {
      const conv = convMap.get(key)!
      conv.unread += 1
    }
  }

  const conversations = Array.from(convMap.values())

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="py-20 text-center text-gray-400 text-sm">
          <p className="text-4xl mb-3">💬</p>
          <p>No messages yet.</p>
          <p className="text-xs mt-1">Accept a request or get matched to start chatting.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {conversations.map((conv) => (
            <Link
              key={`${conv.rideId}:${conv.otherUserId}`}
              href={`/messages/${conv.rideId}/${conv.otherUserId}`}
              className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold shrink-0">
                {conv.otherUserName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-medium text-gray-900 text-sm truncate">{conv.otherUserName}</p>
                  <p className="text-[11px] text-gray-400 shrink-0 ml-2">
                    {new Date(conv.lastTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <p className="text-xs text-gray-400 truncate">{conv.rideLabel}</p>
                <p className="text-xs text-gray-600 truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {conv.unread}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
