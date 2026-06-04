'use client'

import { POPULAR_ROUTES } from '@/lib/constants'

interface Props {
  routeFilter: string
  onRouteChange: (v: string) => void
  typeFilter: string
  onTypeChange: (v: string) => void
  timeFilter: string
  onTimeChange: (v: string) => void
  luggageFilter: boolean
  onLuggageChange: (v: boolean) => void
  commutesFilter: boolean
  onCommutesChange: (v: boolean) => void
}

function Chip({
  label,
  active,
  onClick,
  urgent,
}: {
  label: string
  active: boolean
  onClick: () => void
  urgent?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-150 active:scale-95 cursor-pointer ${
        active
          ? urgent
            ? 'bg-red-600 text-white'
            : 'bg-brand text-white'
          : urgent
          ? 'bg-red-50 text-red-700 hover:bg-red-100'
          : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
      }`}
    >
      {label}
    </button>
  )
}

export default function FilterChips({
  routeFilter, onRouteChange,
  typeFilter, onTypeChange,
  timeFilter, onTimeChange,
  luggageFilter, onLuggageChange,
  commutesFilter, onCommutesChange,
}: Props) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-neutral-200/50">
      <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1.5 no-scrollbar">
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

      <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1 no-scrollbar">
        <Chip label="All" active={typeFilter === 'all' && !luggageFilter && !commutesFilter && timeFilter === 'all'} onClick={() => {
          onTypeChange('all')
          onTimeChange('all')
          onLuggageChange(false)
          onCommutesChange(false)
        }} />
        <Chip label="Requests" active={typeFilter === 'request'} onClick={() => onTypeChange('request')} />
        <Chip label="Urgent ASAP" active={timeFilter === 'urgent'} onClick={() => onTimeChange('urgent')} urgent />
        <Chip label="Today" active={timeFilter === 'today'} onClick={() => onTimeChange('today')} />
        <Chip label="Tomorrow" active={timeFilter === 'tomorrow'} onClick={() => onTimeChange('tomorrow')} />
        <Chip label="Daily commutes" active={commutesFilter} onClick={() => onCommutesChange(!commutesFilter)} />
        <Chip label="Luggage only" active={luggageFilter} onClick={() => onLuggageChange(!luggageFilter)} />
      </div>
    </div>
  )
}
