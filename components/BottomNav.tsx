'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const HIDDEN_ON = ['/login', '/terms']

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-brand' : 'text-neutral-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-brand' : 'text-neutral-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}


function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-brand' : 'text-neutral-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} viewBox="0 0 24 24">
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
    <Link href={href} className="flex flex-col items-center gap-1 min-w-[56px] py-1.5">
      {icon}
      <span className={`text-[10px] tracking-tight ${active ? 'text-brand font-bold' : 'text-neutral-400 font-medium'}`}>
        {label}
      </span>
      {active && <span className="w-1.5 h-1.5 rounded-full bg-brand -mt-0.5" />}
    </Link>
  )
}

export default function BottomNav() {
  const pathname = usePathname()

  if (HIDDEN_ON.includes(pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-neutral-200 pb-safe shadow-[0_-4px_24px_rgba(10,10,10,0.06)]">
      <div className="flex items-center justify-around h-[64px] px-2 max-w-md mx-auto">
        <NavItem
          href="/"
          active={pathname === '/'}
          label="Feed"
          icon={<HomeIcon active={pathname === '/'} />}
        />

        <NavItem
          href="/my-rides"
          active={pathname.startsWith('/my-rides')}
          label="Activity"
          icon={<ListIcon active={pathname.startsWith('/my-rides')} />}
        />

        <Link href="/post" className="flex flex-col items-center justify-center -mt-5">
          <div className="w-[48px] h-[48px] rounded-2xl bg-brand flex items-center justify-center shadow-pop hover:bg-brand-dark transition-colors">
            <PlusIcon />
          </div>
          <span className="text-[10px] font-bold text-neutral-400 mt-1.5">Post</span>
        </Link>

        <NavItem
          href="/profile"
          active={pathname.startsWith('/profile')}
          label="Account"
          icon={<PersonIcon active={pathname.startsWith('/profile')} />}
        />
      </div>
    </nav>
  )
}
