import type { RideStatus } from '@/lib/types'

const CONFIG: Record<RideStatus, { dot: string; label: string; className: string }> = {
  open:      { dot: '🟢', label: 'AVAILABLE',  className: 'bg-green-50 text-green-700 border border-green-200' },
  filling:   { dot: '🟡', label: 'FILLING',    className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  matched:   { dot: '🔴', label: 'FILLED',     className: 'bg-red-50 text-red-600 border border-red-200' },
  expired:   { dot: '⚫', label: 'EXPIRED',    className: 'bg-gray-100 text-gray-400 border border-gray-200' },
  cancelled: { dot: '⚫', label: 'CANCELLED',  className: 'bg-gray-100 text-gray-400 border border-gray-200' },
}

export default function StatusBadge({ status }: { status: RideStatus }) {
  const { dot, label, className } = CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${className}`}>
      <span className="text-[8px] leading-none">{dot}</span>
      {label}
    </span>
  )
}
