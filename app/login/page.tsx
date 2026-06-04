'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendMagicLink() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(
        error.message.toLowerCase().includes('rate limit')
          ? 'Too many attempts — please wait a few minutes and try again.'
          : error.message
      )
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand">RideSM</h1>
          <p className="text-gray-400 text-sm mt-1">Community carpool for San Marcos</p>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-4xl mb-4">📬</p>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-6">
              We sent a magic link to <strong>{email}</strong>. Tap it to sign in — no password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-brand text-sm font-medium"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMagicLink() }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              autoComplete="email"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              onClick={sendMagicLink}
              disabled={loading || !email.trim()}
              className="w-full bg-brand text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">
              We'll email you a link — no password needed.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 mt-8">
          Not affiliated with TXST. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
