export function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function formatDate(date: string | null, time: string | null): string {
  if (!date) return ''
  const d = new Date(`${date}T${time ?? '00:00'}`)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: time ? 'numeric' : undefined,
    minute: time ? '2-digit' : undefined,
  })
}

export function formatTime(time: string | null): string {
  if (!time) return ''
  const d = new Date(`2000-01-01T${time}`)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatDayLabel(date: string): string {
  const today = todayISO()
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const tomorrow = d.toISOString().split('T')[0]
  if (date === today) return 'Today'
  if (date === tomorrow) return 'Tomorrow'
  return new Date(`${date}T12:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

import type { RideWithUser } from './types'

export type TimeGroup = { key: string; label: string; rides: RideWithUser[] }

export function groupByTime(rides: RideWithUser[]): TimeGroup[] {
  const groups = new Map<string, TimeGroup>()

  for (const ride of rides) {
    let key: string
    let label: string

    if (ride.is_now) {
      key = 'now'
      label = '🟢 Right Now'
    } else if (!ride.depart_date) {
      key = 'tbd'
      label = 'Date TBD'
    } else {
      const timeSlot = ride.depart_time_start ?? 'tbd'
      key = `${ride.depart_date}_${timeSlot}`
      const dayLabel = formatDayLabel(ride.depart_date)
      const timeLabel = ride.depart_time_start ? formatTime(ride.depart_time_start) : 'Time TBD'
      label = `${dayLabel} · ${timeLabel}`
    }

    if (!groups.has(key)) groups.set(key, { key, label, rides: [] })
    groups.get(key)!.rides.push(ride)
  }

  return Array.from(groups.values())
}

export function stars(rating: number): string {
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
