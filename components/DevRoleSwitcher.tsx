'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Role = 'customer' | 'driver' | 'admin'

const ROLES: { value: Role; label: string; icon: string }[] = [
  { value: 'customer', label: 'Customer', icon: '🙋' },
  { value: 'driver', label: 'Driver', icon: '🚗' },
  { value: 'admin', label: 'Admin', icon: '⚙️' },
]

export default function DevRoleSwitcher() {
  const [role, setRole] = useState<Role>('customer')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('devRole') as Role | null
    if (saved) setRole(saved)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(r: Role) {
    setRole(r)
    localStorage.setItem('devRole', r)
    setOpen(false)
    if (r === 'admin') router.push('/admin/feedback')
  }

  const current = ROLES.find((r) => r.value === role)!

  return (
    <div ref={ref} className="fixed top-3 right-3 z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/85 text-white text-[11px] font-bold rounded-full shadow-lg backdrop-blur-sm"
      >
        <span>{current.icon}</span>
        <span>{current.label}</span>
        <svg className={`w-3 h-3 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden w-36 py-1">
          <p className="px-3 pt-1 pb-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-wider">View as</p>
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => select(r.value)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                role === r.value
                  ? 'bg-brand text-white'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span>{r.icon}</span>
              <span>{r.label}</span>
              {role === r.value && <span className="ml-auto text-white/70">✓</span>}
            </button>
          ))}
          <div className="mx-3 mt-1.5 mb-1 pt-1.5 border-t border-neutral-100">
            <p className="text-[9px] text-neutral-300 font-medium">temp — remove before launch</p>
          </div>
        </div>
      )}
    </div>
  )
}
