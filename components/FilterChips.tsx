'use client'

import { POPULAR_ROUTES } from '@/lib/constants'

interface Props {
  routeFilter: string
  onRouteChange: (v: string) => void
  typeFilter: string
  onTypeChange: (v: string) => void
  timeFilter: string
  onTimeChange: (v: string) => void
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-brand text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

export default function FilterChips({
  routeFilter,
  onRouteChange,
  typeFilter,
  onTypeChange,
  timeFilter,
  onTimeChange,
}: Props) {
  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
      {/* Route quick-filters */}
      <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 no-scrollbar">
        <Chip label="All routes" active={routeFilter === 'all'} onClick={() => onRouteChange('all')} />
        {POPULAR_ROUTES.map((r) => (
          <Chip
            key={r.label}
            label={r.label}
            active={routeFilter === `${r.from}→${r.to}`}
            onClick={() => onRouteChange(`${r.from}→${r.to}`)}
          />
        ))}
      </div>

      {/* Type + time filters */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1 no-scrollbar">
        <Chip label="All" active={typeFilter === 'all'} onClick={() => onTypeChange('all')} />
        <Chip label="Offers" active={typeFilter === 'offer'} onClick={() => onTypeChange('offer')} />
        <Chip label="Requests" active={typeFilter === 'request'} onClick={() => onTypeChange('request')} />
        <span className="w-px bg-gray-200 self-stretch mx-1" />
        <Chip label="Today" active={timeFilter === 'today'} onClick={() => onTimeChange('today')} />
        <Chip label="Tomorrow" active={timeFilter === 'tomorrow'} onClick={() => onTimeChange('tomorrow')} />
        <Chip label="All dates" active={timeFilter === 'all'} onClick={() => onTimeChange('all')} />
      </div>
    </div>
  )
}
