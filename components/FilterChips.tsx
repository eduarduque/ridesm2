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
      data-active={active}
      className={`chip-glow shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
        active
          ? urgent
            ? 'bg-urgent text-white'
            : 'bg-brand text-white'
          : urgent
          ? 'bg-urgent-light text-urgent hover:bg-orange-100'
          : 'bg-white/80 text-slate-600 border border-slate-200/90 hover:border-slate-300 hover:bg-white'
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
    <div className="sticky top-0 z-10 backdrop-blur-md bg-white/85 border-b border-slate-200/60 shadow-sm">
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
        <Chip label="Offers" active={typeFilter === 'offer'} onClick={() => onTypeChange('offer')} />
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
