export const CITIES = [
  'San Marcos',
  'Austin',
  'Dallas',
  'Seguin',
  'Kyle',
  'Buda',
  'Leander',
  'Irving',
  'Houston',
  'Other',
] as const

export type City = (typeof CITIES)[number]

export const POPULAR_ROUTES = [
  { label: 'SM → Austin', from: 'San Marcos', to: 'Austin' },
  { label: 'Austin → SM', from: 'Austin', to: 'San Marcos' },
  { label: 'SM → Dallas', from: 'San Marcos', to: 'Dallas' },
  { label: 'Dallas → SM', from: 'Dallas', to: 'San Marcos' },
  { label: '📍 Within SM', from: 'San Marcos', to: 'San Marcos' },
  { label: '📍 Within Austin', from: 'Austin', to: 'Austin' },
] as const

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export type Day = (typeof DAYS)[number]

export const DISCLAIMER =
  'RideSM is a free community board for organizing shared rides. By using this app you agree that: RideSM is not affiliated with Texas State University or any transportation company. This app only connects people — it does not provide transportation services. The developer is not responsible for any incidents, accidents, losses, delays, or disputes that occur before, during, or after any ride arranged through this platform. All arrangements including any voluntary cash contributions are made solely between individuals involved. Use at your own risk.'
