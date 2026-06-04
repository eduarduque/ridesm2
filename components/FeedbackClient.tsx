'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'general', label: 'General' },
] as const

type Category = typeof CATEGORIES[number]['value']

interface Props {
  userId: string
  userEmail: string
}

export default function FeedbackClient({ userId, userEmail }: Props) {
  const [category, setCategory] = useState<Category>('general')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.from('feedback').insert({
      user_id: userId,
      user_email: userEmail,
      category,
      message: message.trim(),
    })

    if (error) {
      setError('Something went wrong. Try again.')
    } else {
      setDone(true)
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Thanks for the feedback!</h2>
          <p className="text-sm text-neutral-500">Your message has been sent.</p>
          <Link href="/" className="inline-block mt-4 px-5 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-colors">
            Back to feed
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-32 max-w-md mx-auto w-full border-x border-neutral-100">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-100 flex items-center gap-3">
        <Link href="/profile" className="text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-neutral-900">Send Feedback</h1>
      </div>

      <form onSubmit={submit} className="px-4 py-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-neutral-700">Category</label>
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  category === c.value
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand hover:text-brand'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-semibold text-neutral-700">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind? Bug, idea, or anything else..."
            maxLength={1000}
            rows={6}
            required
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand resize-none"
          />
          <p className="text-right text-[11px] text-neutral-400">{message.length}/1000</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="w-full py-3 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-40 cursor-pointer"
        >
          {submitting ? 'Sending…' : 'Send Feedback'}
        </button>
      </form>
    </div>
  )
}
