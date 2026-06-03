import Link from 'next/link'
import { DISCLAIMER } from '@/lib/constants'

export default function TermsPage() {
  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
      <Link href="/" className="text-brand text-sm font-medium mb-6 inline-block">
        ← Back to Feed
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Terms &amp; Disclaimer</h1>
      <p className="text-gray-700 leading-relaxed text-sm">{DISCLAIMER}</p>
      <div className="mt-10 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          RideSM is a free community board. Not affiliated with Texas State University or any
          transportation company. Use at your own risk.
        </p>
      </div>
    </div>
  )
}
