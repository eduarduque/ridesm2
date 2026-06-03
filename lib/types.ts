export interface User {
  id: string
  phone: string
  name: string | null
  rating: number
  ride_count: number
  agreed_terms_at: string | null
  created_at: string
}

export type RideStatus = 'open' | 'filling' | 'matched' | 'expired' | 'cancelled'
export type RideType = 'offer' | 'request'

export interface Ride {
  id: string
  user_id: string
  type: RideType
  from_city: string
  to_city: string
  depart_date: string | null
  depart_time_start: string | null
  is_now: boolean
  seats: number
  note: string | null
  status: RideStatus
  created_at: string
}

export interface RideWithUser extends Ride {
  users: Pick<User, 'id' | 'name' | 'rating' | 'phone'>
}

export type MatchStatus = 'pending' | 'accepted' | 'declined'

export interface MatchRequest {
  id: string
  ride_id: string
  requester_id: string
  status: MatchStatus
  created_at: string
}

export interface MatchRequestWithDetails extends MatchRequest {
  rides: RideWithUser
  users: Pick<User, 'id' | 'name' | 'rating' | 'phone'>
}

export interface Message {
  id: string
  ride_id: string
  sender_id: string
  receiver_id: string
  body: string
  read_at: string | null
  created_at: string
  sender?: Pick<User, 'id' | 'name'>
}

export interface Rating {
  id: string
  ride_id: string
  rater_id: string
  rated_id: string
  stars: number
  created_at: string
}
