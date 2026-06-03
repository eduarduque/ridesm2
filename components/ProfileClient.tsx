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
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function saveName() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ name: name.trim() || null })
      .eq('id', profile.id)
    if (error) {
      setError(error.message)
    } else {
      setEditing(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

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
          <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-brand text-2xl font-bold">
            {(profile.name ?? profile.phone)[0].toUpperCase()}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName() }}
                />
                <button
                  onClick={saveName}
                  disabled={saving}
                  className="px-3 py-2 bg-brand text-white text-sm rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setName(profile.name ?? '') }}
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
                <button
                  onClick={() => setEditing(true)}
                  className="text-brand text-sm font-medium"
                >
                  Edit
                </button>
              </div>
            )}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-500">Phone</span>
            <span className="text-sm font-medium text-gray-900">{profile.phone}</span>
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

        {/* Sign out */}
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
