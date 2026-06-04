'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface Props {
  profile: User
  isAdmin?: boolean
}

export default function ProfileClient({ profile, isAdmin }: Props) {
  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [editingName, setEditingName] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [devRole, setDevRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setDevRole(localStorage.getItem('devRole'))
    const handler = (e: Event) => setDevRole((e as CustomEvent).detail)
    window.addEventListener('devRoleChange', handler)
    return () => window.removeEventListener('devRoleChange', handler)
  }, [])

  async function saveField(field: 'name' | 'phone', value: string) {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ [field]: value.trim() || null })
      .eq('id', profile.id)
    if (error) {
      setError(error.message)
    } else {
      if (field === 'name') setEditingName(false)
      if (field === 'phone') setEditingPhone(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = (profile.name ?? profile.phone ?? '?')[0].toUpperCase()

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-white pb-32 max-w-md mx-auto w-full border-x border-neutral-100">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-100">
        <h1 className="text-xl font-bold text-neutral-900">Account</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-brand text-2xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') saveField('name', name) }}
                />
                <button
                  onClick={() => saveField('name', name)}
                  disabled={saving}
                  className="px-3 py-2 bg-brand text-white text-xs rounded-lg font-bold disabled:opacity-50 hover:bg-brand-dark transition-colors cursor-pointer"
                >
                  {saving ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditingName(false); setName(profile.name ?? '') }}
                  className="px-3 py-2 text-neutral-500 text-xs font-semibold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-neutral-900">
                  {profile.name ?? <span className="text-neutral-400 italic font-normal">No name set</span>}
                </p>
                <button onClick={() => setEditingName(true)} className="text-brand text-xs font-semibold hover:underline cursor-pointer">
                  Edit
                </button>
              </div>
            )}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-neutral-50 rounded-xl border border-neutral-200/60 divide-y divide-neutral-200/60 overflow-hidden">
          {/* Phone row — editable */}
          <div className="px-4 py-3.5">
            {editingPhone ? (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-neutral-500 shrink-0 font-medium">Phone</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 512 555 1234"
                  className="flex-1 border border-neutral-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') saveField('phone', phone) }}
                />
                <button
                  onClick={() => saveField('phone', phone)}
                  disabled={saving}
                  className="px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {saving ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditingPhone(false); setPhone(profile.phone ?? '') }}
                  className="text-neutral-500 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500 font-medium">Phone</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-900">
                    {profile.phone ?? <span className="text-neutral-400 italic font-normal">Not set</span>}
                  </span>
                  <button onClick={() => setEditingPhone(true)} className="text-brand text-xs font-semibold hover:underline cursor-pointer">
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center px-4 py-3.5">
            <span className="text-sm text-neutral-500 font-medium">Total Rides</span>
            <span className="text-sm font-bold text-neutral-900">{profile.ride_count}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3.5">
            <span className="text-sm text-neutral-500 font-medium">Member since</span>
            <span className="text-sm font-bold text-neutral-900">{memberSince}</span>
          </div>
        </div>

        {isAdmin && (!devRole || devRole === 'admin') && (
          <Link
            href="/admin/feedback"
            className="flex items-center justify-center gap-2 w-full py-3 text-xs font-bold text-brand border border-brand/30 bg-brand/5 rounded-lg hover:bg-brand/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            View Feedback
          </Link>
        )}

        <button
          onClick={signOut}
          className="w-full py-3 text-xs font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        >
          Sign out
        </button>

        <p className="text-center text-[10px] text-neutral-400">
          RideSM is a free community board. Not affiliated with any organization. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
