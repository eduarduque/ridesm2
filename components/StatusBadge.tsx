import type { RideStatus } from '@/lib/types'

const CONFIG: Record<RideStatus, { label: string; className: string; dotColor: string }> = {
  open:      { label: 'Available',  className: 'bg-emerald-50 text-emerald-800 border border-emerald-100/80', dotColor: 'bg-emerald-500' },
  filling:   { label: 'Filling',    className: 'bg-amber-50 text-amber-800 border border-amber-100/80', dotColor: 'bg-amber-500' },
  matched:   { label: 'Filled',     className: 'bg-neutral-900 text-white border border-neutral-900', dotColor: 'bg-neutral-400' },
  expired:   { label: 'Expired',    className: 'bg-neutral-100 text-neutral-500 border border-neutral-200/50', dotColor: 'bg-neutral-400' },
  cancelled: { label: 'Cancelled',  className: 'bg-neutral-100 text-neutral-400 border border-neutral-200/50', dotColor: 'bg-neutral-300' },
}

export default function StatusBadge({ status }: { status: RideStatus }) {
  const { label, className, dotColor } = CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  )
}
