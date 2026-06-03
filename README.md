# RideSM

Community carpool board for Texas State University students. Find or offer rides on the San Marcos ↔ Austin corridor — and beyond.

**Live app:** _(add your Vercel URL here)_

---

## Features

- **Real-time feed** — ride posts update instantly via Supabase Realtime
- **Filter chips** — filter by popular route, ride type (offer/request), or date
- **Phone OTP auth** — no passwords, just your number
- **Post a ride** — offer seats or request a ride, with a "Right now" option that expires in 45 min
- **Match requests** — request a seat → driver accepts/declines from My Rides
- **In-app messaging** — chat unlocks only after a match is accepted (no phone numbers revealed)
- **Unread badge** — live message count on the Messages tab
- **PWA** — installable from the browser on iOS and Android

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Hosting | Vercel |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/ridesm.git
cd ridesm
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Open **SQL Editor** → paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**
3. Go to **Authentication → Providers → Phone** → Enable (requires a [Twilio](https://twilio.com) account for SMS)
4. Copy your **Project URL** and **anon key** from **Project Settings → API**

### 3. Add environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Phone OTP only works once Twilio is wired up in Supabase. Until then you can manually insert a test user row in the Supabase SQL editor.

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Import** → select the repo
3. Add the two env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Click **Deploy**

---

## Auto-Expiry (optional but recommended)

Stale rides need to be expired automatically. Enable this in Supabase:

1. **Database → Extensions** → enable `pg_cron`
2. Run this in the SQL Editor:

```sql
SELECT cron.schedule('expire-rides', '*/5 * * * *', $$
  UPDATE public.rides SET status = 'expired'
  WHERE status IN ('open', 'filling')
    AND is_now = false
    AND (depart_date + depart_time_start) <= now();

  UPDATE public.rides SET status = 'expired'
  WHERE status IN ('open', 'filling')
    AND is_now = true
    AND created_at < now() - interval '45 minutes';
$$);
```

---

## Project Structure

```
ridesm/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # / — Feed
│   ├── login/page.tsx          # /login — Phone OTP
│   ├── post/page.tsx           # /post — Post a ride
│   ├── ride/[id]/page.tsx      # /ride/[id] — Ride detail
│   ├── my-rides/page.tsx       # /my-rides — Your posts + requests
│   ├── messages/               # /messages — Inbox + chat
│   ├── profile/page.tsx        # /profile
│   └── terms/page.tsx          # /terms — Disclaimer
├── components/                 # Shared UI components
├── lib/
│   ├── supabase/               # Browser + server Supabase clients
│   ├── types.ts                # TypeScript interfaces
│   ├── constants.ts            # Cities, routes, disclaimer text
│   └── utils.ts                # timeAgo, formatDate, stars
├── supabase/
│   └── schema.sql              # Full DB schema + RLS + realtime setup
├── public/
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
└── proxy.ts                    # Auth guard (Next.js 16 proxy)
```

---

## Cities Supported

San Marcos · Austin · Dallas · Seguin · Kyle · Buda · Leander · Irving · Houston · Other

**Popular routes:** SM → Austin · Austin → SM · SM → Dallas · Dallas → SM

---

## Disclaimer

RideSM is a free community board for organizing shared rides. It is not affiliated with Texas State University or any transportation company. This app only connects people — it does not provide transportation services. The developer is not responsible for any incidents, accidents, losses, delays, or disputes that occur before, during, or after any ride arranged through this platform. Use at your own risk.
