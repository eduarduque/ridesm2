import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import DisclaimerModal from '@/components/DisclaimerModal'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'RideSM',
  description: 'Community carpool board for Texas State University students',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RideSM',
  },
}

export const viewport: Viewport = {
  themeColor: '#534AB7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="h-full bg-white text-gray-900 font-sans">
        <ServiceWorkerRegistrar />
        <DisclaimerModal />
        <main className="pb-16 min-h-full">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
