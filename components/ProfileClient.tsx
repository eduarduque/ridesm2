'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'
import { stars } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Props {
  profile: User
}

export default function ProfileClient({ profile }: Props) {
  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [editingName, setEditingName] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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
    <div className="min-h-screen pb-28">
      <div className="px-4 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
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
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') saveField('name', name) }}
                />
                <button
                  onClick={() => saveField('name', name)}
                  disabled={saving}
                  className="px-3 py-2 bg-brand text-white text-sm rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditingName(false); setName(profile.name ?? '') }}
                  className="px-3 py-2 text-gray-500 text-sm"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">
                  {profile.name ?? <span className="text-gray-400 italic">No name set</span>}
                </p>
                <button onClick={() => setEditingName(true)} className="text-brand text-sm font-medium">
                  Edit
                </button>
              </div>
            )}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
          {/* Phone row — editable */}
          <div className="px-4 py-3">
            {editingPhone ? (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-500 shrink-0">Phone</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 512 555 1234"
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') saveField('phone', phone) }}
                />
                <button
                  onClick={() => saveField('phone', phone)}
                  disabled={saving}
                  className="px-3 py-1.5 bg-brand text-white text-sm rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditingPhone(false); setPhone(profile.phone ?? '') }}
                  className="text-gray-500 text-sm"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Phone</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {profile.phone ?? <span className="text-gray-400 italic">Not set</span>}
                  </span>
                  <button onClick={() => setEditingPhone(true)} className="text-brand text-xs font-medium">
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-500">Rating</span>
            <div className="text-right">
              <span className="text-amber-400 text-sm">{stars(profile.rating)}</span>
              <span className="text-gray-400 text-sm ml-1">{profile.rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-500">Rides</span>
            <span className="text-sm font-medium text-gray-900">{profile.ride_count}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-500">Member since</span>
            <span className="text-sm font-medium text-gray-900">{memberSince}</span>
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full py-3 text-sm font-medium text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          Sign out
        </button>

        <p className="text-center text-[11px] text-gray-300">
          RideSM is a free community board. Not affiliated with TXST. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
