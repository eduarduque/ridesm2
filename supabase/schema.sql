-- RideSM Database Schema
-- Paste this entire file into Supabase > SQL Editor > Run

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,            -- matches auth.users.id
  phone TEXT UNIQUE,
  name TEXT,
  rating NUMERIC(2,1) DEFAULT 5.0,
  ride_count INTEGER DEFAULT 0,
  agreed_terms_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('offer', 'request')) NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  depart_date DATE,
  depart_time_start TIME,
  is_now BOOLEAN DEFAULT false,
  seats INTEGER DEFAULT 1,
  note TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'filling', 'matched', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ride_id, requester_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id),
  rater_id UUID REFERENCES public.users(id),
  rated_id UUID REFERENCES public.users(id),
  stars INTEGER CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ride_id, rater_id, rated_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_rides_status_date ON public.rides(status, depart_date);
CREATE INDEX IF NOT EXISTS idx_rides_user_id ON public.rides(user_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_ride ON public.match_requests(ride_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_requester ON public.match_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_messages_ride ON public.messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON public.messages(receiver_id, read_at) WHERE read_at IS NULL;

-- ============================================================
-- ENABLE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_requests;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- users: anyone can read; only owner can update
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- rides: anyone can read; authenticated users can insert; owner can update/delete
CREATE POLICY "rides_select" ON public.rides FOR SELECT USING (true);
CREATE POLICY "rides_insert" ON public.rides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rides_update" ON public.rides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rides_delete" ON public.rides FOR DELETE USING (auth.uid() = user_id);

-- match_requests: ride owner or requester can read; authenticated users can insert
CREATE POLICY "match_requests_select" ON public.match_requests FOR SELECT
  USING (
    auth.uid() = requester_id
    OR auth.uid() IN (SELECT user_id FROM public.rides WHERE id = ride_id)
  );
CREATE POLICY "match_requests_insert" ON public.match_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "match_requests_update" ON public.match_requests FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public.rides WHERE id = ride_id)
  );

-- messages: only sender or receiver can read/insert
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);  -- only receiver marks as read

-- ratings: anyone can read; authenticated users can insert once per ride pair
CREATE POLICY "ratings_select" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- ============================================================
-- AUTO-EXPIRY SQL  (schedule this as a cron job)
-- Supabase: Database > Extensions > enable pg_cron
-- Then run: SELECT cron.schedule('expire-rides', '*/5 * * * *', $$ <sql below> $$);
-- ============================================================

/*
-- Expire scheduled rides at departure time
UPDATE public.rides SET status = 'expired'
WHERE status IN ('open', 'filling')
  AND is_now = false
  AND (depart_date + depart_time_start) <= now();

-- Expire "right now" posts after 45 min
UPDATE public.rides SET status = 'expired'
WHERE status IN ('open', 'filling')
  AND is_now = true
  AND created_at < now() - interval '45 minutes';
*/
