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
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Before you ride</h2>
        <p className="text-xs text-brand font-semibold mb-3">Community board · Not affiliated with TXST</p>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{DISCLAIMER}</p>
        <button
          onClick={accept}
          className="w-full bg-brand text-white font-semibold py-3 rounded-xl text-sm active:opacity-80"
        >
          I understand — let me in
        </button>
      </div>
    </div>
  )
}
