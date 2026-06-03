import type { RideStatus } from '@/lib/types'

const CONFIG: Record<RideStatus, { label: string; className: string }> = {
  open: { label: 'AVAILABLE', className: 'bg-green-100 text-green-700' },
  filling: { label: 'FILLING', className: 'bg-amber-100 text-amber-700' },
  matched: { label: 'MATCHED', className: 'bg-brand-light text-brand' },
  expired: { label: 'EXPIRED', className: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'CANCELLED', className: 'bg-gray-100 text-gray-500' },
}

export default function StatusBadge({ status }: { status: RideStatus }) {
  const { label, className } = CONFIG[status]
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${className}`}>
      {label}
    </span>
  )
}
