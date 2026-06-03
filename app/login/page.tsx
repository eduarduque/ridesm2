'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function sendOtp() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  async function verifyOtp() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    })
    if (error) {
      setError(error.message)
    } else if (data.user) {
      await supabase.from('users').upsert(
        { id: data.user.id, phone: data.user.phone ?? phone },
        { onConflict: 'id' }
      )
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand">RideSM</h1>
          <p className="text-gray-400 text-sm mt-1">Community carpool for TXST students</p>
        </div>

        {step === 'phone' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone number
            </label>
            <input
              type="tel"
              placeholder="+1 210 555 1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendOtp() }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              onClick={sendOtp}
              disabled={loading || !phone.trim()}
              className="w-full bg-brand text-white font-semibold py-3 rounded-xl disabled:opacity-50 hover:bg-brand-dark transition-colors"
            >
              {loading ? 'Sending code…' : 'Send code'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">
              We&apos;ll text you a 6-digit code. Msg rates may apply.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code sent to <strong>{phone}</strong>
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') verifyOtp() }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-2xl text-center tracking-[0.5em] mb-4 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full bg-brand text-white font-semibold py-3 rounded-xl disabled:opacity-50 hover:bg-brand-dark transition-colors"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button
              onClick={() => { setStep('phone'); setOtp(''); setError('') }}
              className="w-full text-gray-500 text-sm mt-3 py-2"
            >
              ← Change number
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 mt-8">
          Not affiliated with TXST. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
