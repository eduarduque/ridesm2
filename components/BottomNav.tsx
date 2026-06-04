'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const HIDDEN_ON = ['/login', '/terms']

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-brand' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-brand' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function ChatIcon({ active, badge }: { active: boolean; badge: number }) {
  return (
    <div className="relative">
      <svg className={`w-6 h-6 ${active ? 'text-brand' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
  )
}

function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-brand' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setLoggedIn(true)

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('read_at', null)
      setUnread(count ?? 0)

      const channel = supabase
        .channel('unread-badge')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        }, () => setUnread(n => n + 1))
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        }, () => {
          supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .is('read_at', null)
            .then(({ count }) => setUnread(count ?? 0))
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    init()
  }, [])

  if (HIDDEN_ON.includes(pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 flex items-center justify-around h-16">
      <Link href="/" className="flex flex-col items-center gap-0.5">
        <HomeIcon active={pathname === '/'} />
        <span className={`text-[10px] ${pathname === '/' ? 'text-brand font-semibold' : 'text-gray-400'}`}>Feed</span>
      </Link>

      <Link href="/my-rides" className="flex flex-col items-center gap-0.5">
        <ListIcon active={pathname.startsWith('/my-rides')} />
        <span className={`text-[10px] ${pathname.startsWith('/my-rides') ? 'text-brand font-semibold' : 'text-gray-400'}`}>My Rides</span>
      </Link>

      <Link href="/post" className="flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center shadow-lg -mt-6 border-4 border-white">
          <PlusIcon />
        </div>
      </Link>

      <Link href="/messages" className="flex flex-col items-center gap-0.5">
        <ChatIcon active={pathname.startsWith('/messages')} badge={unread} />
        <span className={`text-[10px] ${pathname.startsWith('/messages') ? 'text-brand font-semibold' : 'text-gray-400'}`}>Messages</span>
      </Link>

      <Link href="/profile" className="flex flex-col items-center gap-0.5">
        <PersonIcon active={pathname.startsWith('/profile')} />
        <span className={`text-[10px] ${pathname.startsWith('/profile') ? 'text-brand font-semibold' : 'text-gray-400'}`}>Profile</span>
      </Link>
    </nav>
  )
}
