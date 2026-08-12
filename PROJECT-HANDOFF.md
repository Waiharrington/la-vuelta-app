# La Vuelta Running Co. - Project Handoff

## Project Overview

**La Vuelta Running Co.** is a running club web application built for a running club based in Maracay, Venezuela. The app enables runners to track GPS activities, share them on a social feed, compete on leaderboards, and build community — all with the brand identity of La Vuelta Running Co.

- **Live URL**: https://lavuelta-app.vercel.app
- **GitHub**: https://github.com/andreadigitaljobs-arch/la-vuelta-app
- **Vercel Project**: `la-vuelta-app` (account: `waiharrington`)
- **Supabase**: Self-hosted at https://supabase.somosdostudio.com

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 16.2.10 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Auth & DB | Supabase (self-hosted) | @supabase/ssr 0.12 |
| Maps | Leaflet + React-Leaflet | 1.9.4 / 5.0 |
| Icons | Lucide React | 1.23 |
| Dates | date-fns | 4.4 |
| Deployment | Vercel | Hobby Plan |
| PWA | Service Worker + Web Manifest | Yes |

---

## Brand Identity

Extracted from the original La Vuelta RunClub site.

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Fire | `#52130C` | Primary background, CTA buttons |
| Wool | `#C4BAB3` | Body text, secondary elements |
| Wine | `#741717` | Headings, accents |
| Caramel | `#BD695D` | Hover states, highlights |
| Chestnut | `#603A30` | Cards, secondary backgrounds |
| Cream | `#F4EFEA` | Light text on dark |
| Dark | `#111111` | Scrollbar, dark accents |

### Fonts

| Font | CSS Variable | Usage |
|------|-------------|-------|
| Anton | `--font-display` | Headings, hero text |
| Inter | `--font-body` | Body text, UI |
| Outfit | `--font-secondary` | Secondary headings, nav |

### Brand Assets

- Logos located in `public/brand/` directory
- Tagline: "No importa tu ritmo. La vuelta se da juntos."
- Secondary tagline: "Cada vuelta cuenta una historia."
- Brand voice: Bold, community-driven, inclusive

---

## Project Structure

```
la-vuelta-app/
├── public/                          # Static assets
│   ├── brand/                       # Logos, icons
│   ├── manifest.json                # PWA manifest
│   └── sw.js                        # Service worker
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── layout.tsx               # Root layout (fonts, AuthProvider, PWARegister)
│   │   ├── page.tsx                 # Landing page with ticker
│   │   ├── globals.css              # Tailwind theme, animations
│   │   ├── not-found.tsx            # 404 page
│   │   ├── login/page.tsx           # Login (email + Google OAuth)
│   │   ├── register/page.tsx        # Register (email + Google OAuth)
│   │   ├── auth/callback/route.ts   # OAuth callback handler
│   │   ├── feed/page.tsx            # Social feed (posts + activities)
│   │   ├── tracker/page.tsx         # GPS activity recorder + Leaflet map
│   │   ├── activities/page.tsx      # Activity history + personal stats
│   │   ├── leaderboard/page.tsx     # Ranking system (weekly/monthly/all)
│   │   └── profile/page.tsx         # User profile page
│   ├── components/
│   │   ├── auth-provider.tsx        # React context for auth state
│   │   ├── navigation.tsx           # Bottom tab navigation bar
│   │   ├── map-view.tsx             # Leaflet map component (dynamic import)
│   │   └── pwa-register.tsx         # Service worker registration
│   ├── hooks/
│   │   └── use-run-notifications.ts # Media Session API + Wake Lock hook
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client (schema: lavuelta)
│   │   │   ├── server.ts            # Server client (schema: lavuelta)
│   │   │   └── middleware.ts        # Auth middleware (session + route protection)
│   │   └── utils.ts                 # formatDistance, formatDuration, formatPace, formatDate
│   └── middleware.ts                 # Next.js middleware entry point
├── supabase/
│   ├── lavuelta-schema.sql          # Full database schema (reference copy)
│   └── posts-table.sql              # Posts table DDL
├── PROJECT-HANDOFF.md               # This file
├── .env.local                       # Supabase credentials
├── .env.local.example               # Template for env vars
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

---

## Database Schema

All tables live in a dedicated `lavuelta` schema (multi-tenant architecture).

### Tables

| Table | Purpose |
|-------|---------|
| `lavuelta.profiles` | User profiles (linked to `auth.users` via UUID) |
| `lavuelta.activities` | GPS-tracked runs/walks/bikes/hikes |
| `lavuelta.likes` | Likes on activities and posts |
| `lavuelta.comments` | Comments on activities and posts |
| `lavuelta.follows` | User follow relationships |
| `lavuelta.clubs` | Running clubs (default: La Vuelta Running Co.) |
| `lavuelta.club_members` | Club membership with roles |
| `lavuelta.events` | Club events (runs, meetups) |
| `lavuelta.event_participants` | Event RSVPs |
| `lavuelta.posts` | Text-only social posts (max 500 chars) |

### Key Design Decisions

- **Schema isolation**: All tables in `lavuelta` schema, not `public`
- **PostgREST search path**: `PGRST_DB_EXTRA_SEARCH_PATH=lavuelta,public` — eliminates need for `Content-Profile` header forwarding through Kong
- **RLS enabled on all tables** with policies for public read + owner CRUD
- **Auto-profile trigger**: `lavuelta.handle_new_user()` creates a profile row when a user signs up via `auth.users`
- **Leaderboard RPC**: `lavuelta.get_leaderboard(period, limit)` returns ranked users by distance
- **Polymorphic likes/comments**: `likes.activity_id` and `comments.activity_id` are used for both activities and posts (same column, reused)

### RLS Policies Summary

- **Profiles**: Public read, owner insert/update
- **Activities**: Public read (if public), owner CRUD
- **Likes**: Public read, owner insert/delete
- **Comments**: Public read, owner insert/delete
- **Posts**: Public read, owner insert/update/delete
- **Follows**: Public read, owner insert/delete
- **Clubs**: Public read, creator manage
- **Club Members**: Public read, self-register, admin remove
- **Events**: Public read, creator manage
- **Event Participants**: Public read, self-register

### Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `lavuelta_avatars` | Yes | User profile pictures |
| `lavuelta_activities` | Yes | Activity-related images |

---

## Supabase Configuration

### Self-Hosted Instance

- **URL**: https://supabase.somosdostudio.com
- **VPS**: 62.171.160.75 (SSH: root, key: `C:\Users\Waiha\.ssh\supabasesomos2_ed25519`)
- **Docker compose**: `/opt/supabase/docker/docker-compose.yml`
- **Env file**: `/opt/supabase/docker/.env`

### API Keys (stored in `.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://supabase.somosdostudio.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoa2VhZ3VhbXl6aWFtcGp2d2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNjIwODcsImV4cCI6MjA5ODcyMjA4N30.69WjpEEUZvjDHyeE-5_8qUhxuf3BR35cOOXb43EI6jo
```

### PostgREST Configuration (Kong)

```yaml
PGRST_DB_SCHEMAS=lavuelta,public,storage,graphql_public,astrobarber,janastudio,pandabarber
PGRST_DB_EXTRA_SEARCH_PATH=lavuelta,public
```

### SSH Commands Reference

```bash
# SSH into VPS
ssh -i C:\Users\Waiha\.ssh\supabasesomos2_ed25519 root@62.171.160.75

# Execute SQL on Supabase
scp -i C:\Users\Waiha\.ssh\supabasesomos2_ed25519 file.sql root@62.171.160.75:/tmp/
ssh -i C:\Users\Waiha\.ssh\supabasesomos2_ed25519 root@62.171.160.75 "docker exec -i supabase-db psql -U postgres -f /tmp/file.sql"

# Restart Kong (after config changes)
ssh root@62.171.160.75 "cd /opt/supabase/docker && docker compose restart kong"
```

---

## Authentication

### Supported Methods

1. **Email/Password** — Standard Supabase auth
2. **Google OAuth** — Configured via Supabase Dashboard > Auth > Providers

### Google OAuth Setup

- **Client ID**: `632190521976-arbh01tu8du9r9tlnkuraekhhonr8n3n.apps.googleusercontent.com`
- **Client Secret**: (stored in Supabase Dashboard)
- **Redirect URIs** (need to configure in Google Cloud Console):
  - `https://supabase.somosdostudio.com/auth/v1/callback`
  - `https://lavuelta-app.vercel.app/auth/callback`

### Route Protection

The middleware (`src/lib/supabase/middleware.ts`) handles:

- **Protected routes**: `/feed`, `/activities`, `/tracker`, `/leaderboard`, `/profile` — redirects to `/login` if not authenticated
- **Auth pages**: `/login`, `/register` — redirects to `/feed` if already authenticated
- **Public routes**: `/` (landing page), `/auth/callback`

### OAuth Callback

`src/app/auth/callback/route.ts` handles the OAuth redirect:
- Exchanges the auth code for a session
- Redirects to `/feed` on success
- Redirects to `/login?error=...` on failure

---

## Pages & Features

### Landing Page (`/`)
- Hero section with brand imagery
- Animated ticker with brand values
- CTA buttons to login/register
- Brand colors and fonts on display

### Login (`/login`)
- Email/password form with show/hide password toggle
- Google OAuth button
- Link to register page

### Register (`/register`)
- Email/password form with confirmation
- Google OAuth button
- Link to login page

### Social Feed (`/feed`)
- Post creation box (textarea, max 500 chars, "Publicar" button)
- Displays posts and activities from the community, sorted by date
- Like functionality with optimistic UI + bounce animation
- Comment section (expandable per item)
- Delete button on own posts

### Activity Tracker (`/tracker`)
- GPS recording using browser Geolocation API
- Real-time map display via Leaflet (dynamic import)
- Tracking controls: start, pause, resume, stop
- Stats panel: distance, time, pace, cadence estimation (from GPS speed, ~0.75m stride)
- **Kilometer splits**: records time and pace for each completed kilometer
- **Haptic feedback**: vibration on start, km milestones (pattern 200-100-200-100-400), stop
- **Media Session API**: notification bar shows `CORRIENDO — X.XX km` / `PAUSADO` with time and pace
- **Screen Wake Lock**: screen stays on during tracking, re-acquires on visibility change
- Saves activity at **0m distance** (no minimum), with route coordinates, distance, duration, pace, splits

### Activity History (`/activities`)
- List of user's past activities
- Personal stats: total distance, total runs, avg pace
- Activity detail cards

### Leaderboard (`/leaderboard`)
- Weekly, monthly, and all-time rankings
- Based on `lavuelta.get_leaderboard()` RPC function
- Shows distance, run count, and avg pace per user

### Profile (`/profile`)
- Banner, stats, info rows
- Activity count and stats

### PWA Features
- **Web App Manifest** (`public/manifest.json`): name, icons, shortcuts, screenshots
- **Service Worker** (`public/sw.js`): offline caching, stale-while-revalidate
- **PWA Register** component: auto-registers service worker on mount
- **Media Session API** (`use-run-notifications` hook): lock screen / notification bar stats
- **Screen Wake Lock**: prevents screen dimming during GPS tracking
- **Haptic Feedback**: vibration patterns for key events

### Navigation
- Fixed header with logo + logout
- Bottom tab bar with 5 tabs: Feed, Tracker, Activities, Leaderboard, Profile
- Active state highlighting

---

## Deployment

### Vercel

- **Production URL**: https://lavuelta-app.vercel.app
- **Account**: `waiharrington`
- **Scope**: `waiharringtons-projects`

### Deploy Command

```bash
vercel --prod --yes
```

### Environment Variables (Vercel)

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://supabase.somosdostudio.com` | production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (see .env.local) | production |

### Known Deployment Issues

1. **Preview deploys fail**: Environment variables are only set for `production`, not `preview`. Always deploy with `--prod` flag.
2. **Hobby Plan SSO Block**: The `andreadigitaljobs-arch` account's team had SSO protection that blocked deployments. Fixed by deploying under `waiharrington`.
3. **Middleware Deprecation**: Next.js 16 deprecated `middleware.ts` in favor of `proxy`. Works fine but should be migrated.
4. **Commit Author Block**: Vercel Hobby plan blocks Git-triggered deploys when commit author lacks project access. Use CLI deploys.

### GitHub

- **Repo**: `https://github.com/andreadigitaljobs-arch/la-vuelta-app`
- **Visibility**: Public
- **Branch**: `master`
- **Git Author** (configured locally):
  ```
  user.name: andreadigitaljobs-arch
  user.email: andreadigitaljobs@gmail.com
  ```

---

## What's Left / Next Steps

### Immediate (P0)

1. **Configure Google Cloud Console** — Add Vercel domain as authorized redirect URI:
   - `https://lavuelta-app.vercel.app/auth/callback`
2. **Configure Supabase Auth** — Set Site URL in Dashboard > Auth > Configuration:
   - `https://lavuelta-app.vercel.app`
3. **Test end-to-end** — Register, login, Google OAuth, track activity, view feed

### Short-term (P1)

4. **Migrate middleware to proxy** — Next.js 16 deprecated `middleware.ts` in favor of `proxy`
5. **Add custom domain** — Point a `lavuelta.app` or similar domain to Vercel
6. **Activity images** — Allow users to attach photos to activities (storage bucket already configured)
7. **Push notifications** — For new followers, comments, event invites
8. **Post image uploads** — Allow photo attachments on social posts

### Medium-term (P2)

9. **Club management** — Allow users to create/manage clubs (schema supports it, UI not built yet)
10. **Event creation UI** — Calendar view for upcoming club runs
11. **Activity detail page** — Full-page view with map replay, stats, comments
12. **User settings page** — Edit profile, notification preferences, account deletion
13. **Search** — Find users, clubs, activities

### Long-term (P3)

14. **Native app (Swift)** — Dynamic Island, lock screen widgets, Health Kit integration
15. **Offline support** — Cache activities for offline tracking
16. **Training plans** — Structured workout programs
17. **Challenges** — Weekly/monthly distance or run-count challenges

---

## Troubleshooting

### App shows "Login - Vercel" instead of the app
- SSO protection is enabled on the Vercel project
- Run: `vercel project protection disable --sso --scope waiharringtons-projects`

### Deploy says "Blocked"
- The Git commit author doesn't have Vercel project access
- Fix: Deploy via CLI (`vercel deploy`) instead of Git push

### 404 on all routes
- Environment variables not set in Vercel
- Run: `vercel env add NEXT_PUBLIC_SUPABASE_URL production --value "https://supabase.somosdostudio.com" --scope waiharringtons-projects`

### Supabase returns empty or errors
- Check PostgREST config includes `lavuelta` in search path
- SSH into VPS and check: `docker exec supabase-db psql -U postgres -c "\dn"` (should list `lavuelta`)
- Verify RLS policies: `docker exec supabase-db psql -U postgres -c "SELECT * FROM pg_policies WHERE schemaname = 'lavuelta'"`

### Build fails with "NEXT_PUBLIC_SUPABASE_URL" missing
- Env vars need to be set for the correct Vercel environment
- For preview deploys, env vars are NOT set — always deploy with `--prod`

### AuthProvider SSR error during build
- `createBrowserClient()` was called at module level in `auth-provider.tsx`
- Fixed by moving it inside the `useEffect` callback

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout with fonts, AuthProvider, PWARegister |
| `src/app/globals.css` | Brand colors, animations, Leaflet overrides |
| `src/app/feed/page.tsx` | Social feed with posts + activity cards |
| `src/app/tracker/page.tsx` | GPS tracker with splits, haptic, wake lock |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client |
| `src/lib/supabase/middleware.ts` | Auth middleware with route protection |
| `src/components/auth-provider.tsx` | Auth context provider |
| `src/components/navigation.tsx` | Bottom tab navigation |
| `src/components/map-view.tsx` | Leaflet map (dynamic import) |
| `src/components/pwa-register.tsx` | Service worker registration |
| `src/hooks/use-run-notifications.ts` | Media Session API + Wake Lock |
| `src/lib/utils.ts` | Formatting helpers |
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |
| `supabase/lavuelta-schema.sql` | Full database schema |
| `supabase/posts-table.sql` | Posts table DDL |
| `.env.local` | Supabase credentials |

---

*Document updated July 8, 2026*
