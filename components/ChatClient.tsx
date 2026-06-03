'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message, User } from '@/lib/types'
import ChatBubble from './ChatBubble'

interface Props {
  rideId: string
  otherUser: Pick<User, 'id' | 'name' | 'rating'>
  currentUserId: string
  initialMessages: Message[]
  rideLabel: string
}

export default function ChatClient({ rideId, otherUser, currentUserId, initialMessages, rideLabel }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read on mount
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('ride_id', rideId)
      .eq('receiver_id', currentUserId)
      .is('read_at', null)
      .then(() => {})

    const channel = supabase
      .channel(`chat-${rideId}-${otherUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          if (
            (msg.sender_id === currentUserId && msg.receiver_id === otherUser.id) ||
            (msg.sender_id === otherUser.id && msg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, msg])
            if (msg.receiver_id === currentUserId) {
              supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', msg.id)
                .then(() => {})
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [rideId, otherUser.id, currentUserId])

  async function send() {
    if (!body.trim() || sending) return
    setSending(true)
    const supabase = createClient()
    await supabase.from('messages').insert({
      ride_id: rideId,
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      body: body.trim(),
    })
    setBody('')
    setSending(false)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 border-b border-gray-100 bg-white">
        <p className="text-xs text-gray-400 mb-0.5">{rideLabel}</p>
        <h1 className="font-semibold text-gray-900">{otherUser.name ?? 'Anonymous'}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <p>No messages yet.</p>
            <p className="text-xs mt-1">Say hi to coordinate your ride!</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} isMe={msg.sender_id === currentUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2 pb-20">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Message…"
          className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />
        <button
          onClick={send}
          disabled={!body.trim() || sending}
          className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center disabled:opacity-40"
        >
          <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
