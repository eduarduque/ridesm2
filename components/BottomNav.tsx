'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const HIDDEN_ON = ['/login', '/terms']

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-brand' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-brand' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function ChatIcon({ active, badge }: { active: boolean; badge: number }) {
  return (
    <div className="relative">
      <svg className={`w-6 h-6 ${active ? 'text-brand' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none font-bold px-1 shadow-sm">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
  )
}

function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-brand' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function NavItem({
  href,
  active,
  label,
  icon,
}: {
  href: string
  active: boolean
  label: string
  icon: React.ReactNode
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5 min-w-[56px]">
      {icon}
      <span className={`text-[10px] font-medium ${active ? 'text-brand' : 'text-slate-400'}`}>
        {label}
      </span>
      {active && <span className="w-1 h-1 rounded-full bg-brand -mt-0.5" />}
    </Link>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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
    <nav className="fixed bottom-0 left-0 right-0 z-20">
      <div className="mx-2 mb-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-lg shadow-slate-900/5 flex items-end justify-around h-[68px] px-1">
        <NavItem
          href="/"
          active={pathname === '/'}
          label="Feed"
          icon={<HomeIcon active={pathname === '/'} />}
        />

        <NavItem
          href="/my-rides"
          active={pathname.startsWith('/my-rides')}
          label="My Rides"
          icon={<ListIcon active={pathname.startsWith('/my-rides')} />}
        />

        <Link href="/post" className="flex flex-col items-center -mt-7">
          <div className="w-[58px] h-[58px] rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-lg shadow-brand/30 ring-4 ring-white">
            <PlusIcon />
          </div>
        </Link>

        <NavItem
          href="/messages"
          active={pathname.startsWith('/messages')}
          label="Messages"
          icon={<ChatIcon active={pathname.startsWith('/messages')} badge={unread} />}
        />

        <NavItem
          href="/profile"
          active={pathname.startsWith('/profile')}
          label="Profile"
          icon={<PersonIcon active={pathname.startsWith('/profile')} />}
        />
      </div>
    </nav>
  )
}
