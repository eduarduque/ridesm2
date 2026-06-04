'use client'

import { useEffect, useState } from 'react'
import { DISCLAIMER } from '@/lib/constants'

const STORAGE_KEY = 'ridesm_disclaimer_accepted'

export default function DisclaimerModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-6 sm:pb-0">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
        <h2 className="text-lg font-bold text-neutral-900 mb-1">Before you ride</h2>
        <p className="text-xs text-accent font-bold mb-3 uppercase tracking-wider">Community board · Independent project</p>
        <p className="text-sm text-neutral-600 leading-relaxed mb-6 font-medium">{DISCLAIMER}</p>
        <button
          onClick={accept}
          className="w-full bg-brand text-white font-bold py-3.5 rounded-lg text-sm hover:bg-brand-dark transition-colors cursor-pointer"
        >
          I understand — let me in
        </button>
      </div>
    </div>
  )
}
