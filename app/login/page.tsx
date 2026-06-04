'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// Backoff ladder: 1 min → 5 min → tell them to wait an hour
const COOLDOWNS = [60, 300]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [rateLimitHits, setRateLimitHits] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function startCooldown(seconds: number) {
    setCooldown(seconds)
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

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
      if (error.message.toLowerCase().includes('rate limit')) {
        const hits = rateLimitHits + 1
        setRateLimitHits(hits)
        if (hits > COOLDOWNS.length) {
          setError("You've hit the limit for now. Please wait about an hour before trying again.")
        } else {
          startCooldown(COOLDOWNS[hits - 1])
        }
      } else {
        setError(error.message)
      }
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  const mins = Math.ceil(cooldown / 60)
  const cooldownLabel = cooldown >= 60
    ? `${mins} min${mins > 1 ? 's' : ''} ${cooldown % 60 > 0 ? `${cooldown % 60}s` : ''}`.trim()
    : `${cooldown}s`

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white max-w-md mx-auto w-full border-x border-neutral-100">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-brand tracking-tight">RideSM</h1>
          <p className="text-neutral-400 text-xs font-semibold mt-1">Community Carpool Board</p>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-4xl mb-4">📬</p>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">Check your email</h2>
            <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
              We sent a magic link to <strong>{email}</strong>. Tap it to sign in — no password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-brand font-bold text-sm hover:underline cursor-pointer"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              Email address
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !cooldown) sendMagicLink() }}
              className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              autoComplete="email"
            />
            {error && <p className="text-red-500 text-sm mb-4 font-medium">{error}</p>}
            {cooldown > 0 && (
              <p className="text-amber-600 text-sm mb-4 text-center">
                Too many attempts — try again in <strong>{cooldownLabel}</strong>
              </p>
            )}
            <button
              onClick={sendMagicLink}
              disabled={loading || !email.trim() || cooldown > 0}
              className="w-full bg-brand text-white font-bold py-3.5 rounded-lg disabled:opacity-50 hover:bg-brand-dark transition-colors cursor-pointer"
            >
              {loading ? 'Sending…' : cooldown > 0 ? `Wait ${cooldownLabel}` : 'Send magic link'}
            </button>
            <p className="text-center text-xs text-neutral-400 mt-4 font-medium">
              We'll email you a link — no password needed.
            </p>
          </div>
        )}

        <p className="text-center text-[10px] text-neutral-300 mt-12 font-medium">
          Not affiliated with any organization. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
