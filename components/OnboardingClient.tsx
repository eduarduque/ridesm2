'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
}

export default function OnboardingClient({ userId }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function formatPhone(raw: string) {
    // Strip everything except digits and leading +
    const cleaned = raw.replace(/[^\d+]/g, '')
    return cleaned
  }

  async function save() {
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName) { setError('Please enter your name.'); return }
    if (!trimmedPhone) { setError('Please enter your phone number.'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .upsert({ id: userId, name: trimmedName, phone: trimmedPhone }, { onConflict: 'id' })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white max-w-md mx-auto w-full border-x border-neutral-100">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-brand tracking-tight">RideSM</h1>
          <p className="text-neutral-400 text-xs font-semibold mt-1">One last step before you ride</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              Your name
            </label>
            <input
              type="text"
              placeholder="Alex Garcia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              Phone number
            </label>
            <input
              type="tel"
              placeholder="+1 512 555 1234"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              autoComplete="tel"
            />
            <p className="text-xs text-neutral-400 mt-1 font-medium">
              Shared with matched riders so they can reach you. Include country code (e.g. +1).
            </p>
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            onClick={save}
            disabled={loading}
            className="w-full bg-brand text-white font-bold py-3.5 rounded-lg disabled:opacity-50 mt-2 hover:bg-brand-dark transition-colors cursor-pointer"
          >
            {loading ? 'Saving…' : "Let's go →"}
          </button>
        </div>

        <p className="text-center text-[10px] text-neutral-300 mt-8">
          Not affiliated with any organization. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
