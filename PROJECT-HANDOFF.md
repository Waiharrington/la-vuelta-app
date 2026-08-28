# La Vuelta Running Club - Project Handoff

## Project Overview

**La Vuelta Running Club** is a running club web application built for a running club based in Maracay, Venezuela. The app enables runners to track GPS activities, share them on a social feed, build community through clubs and events, and monitor their training progress — all with the brand identity of La Vuelta Running Club.

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
| Native | Capacitor | 8.4 |
| Deployment | Vercel | Hobby Plan |
| PWA | Service Worker + Web Manifest | Yes |
| Testing | Vitest | 4.x |

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
│   │   ├── forgot-password/page.tsx # Password recovery
│   │   ├── reset-password/page.tsx  # Password reset form
│   │   ├── auth/callback/           # OAuth callback
│   │   ├── feed/page.tsx            # Social feed (posts + activities)
│   │   ├── tracker/page.tsx         # GPS activity recorder + Leaflet map
│   │   ├── activities/page.tsx      # Activity history
│   │   ├── activities/[id]/page.tsx # Activity detail with map, splits, comments
│   │   ├── stats/page.tsx           # Training stats with charts
│   │   ├── profile/page.tsx         # User profile (view + edit)
│   │   ├── users/[id]/page.tsx      # Public user profiles
│   │   ├── search/page.tsx          # People + activity search
│   │   ├── settings/page.tsx        # Account settings
│   │   ├── clubs/                   # Club management
│   │   │   ├── page.tsx             # Club listing
│   │   │   ├── new/page.tsx         # Create club
│   │   │   └── [slug]/page.tsx      # Club detail
│   │   ├── events/                  # Event management
│   │   │   ├── page.tsx             # Event listing
│   │   │   ├── new/page.tsx         # Create event
│   │   │   ├── [id]/page.tsx        # Event detail
│   │   │   └── [id]/edit/page.tsx   # Edit event
│   │   ├── routes/                  # Saved routes
│   │   │   ├── page.tsx             # Route listing
│   │   │   └── [id]/page.tsx        # Route detail with map
│   │   ├── terms/page.tsx           # Terms of service
│   │   ├── privacy/page.tsx         # Privacy policy
│   │   └── api/push/register/       # Push notification subscription
│   ├── components/
│   │   ├── auth-provider.tsx        # React context for auth state
│   │   ├── navigation.tsx           # Bottom tab navigation bar
│   │   ├── map-view.tsx             # Leaflet map component (dynamic import)
│   │   ├── pwa-register.tsx         # Service worker registration
│   │   ├── push-notification-prompt.tsx # Push notification opt-in
│   │   ├── error-boundary.tsx       # React error boundary
│   │   └── skeleton.tsx             # Loading skeleton components
│   ├── hooks/
│   │   ├── use-run-notifications.ts # Media Session API + Wake Lock
│   │   └── use-follow.ts            # Follow/unfollow logic
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client (schema: lavuelta)
│   │   │   ├── server.ts            # Server client (schema: lavuelta)
│   │   │   └── middleware.ts        # Auth middleware (session + route protection)
│   │   ├── types.ts                 # Shared TypeScript interfaces
│   │   └── utils.ts                 # formatDistance, formatDuration, formatPace, formatDate
│   └── middleware.ts                # Next.js middleware entry point
├── supabase/
│   ├── lavuelta-schema.sql          # Full database schema (all tables)
│   ├── posts-table.sql              # Posts table DDL (standalone)
│   ├── saved-routes-table.sql       # Saved routes DDL (standalone)
│   └── post-likes-comments.sql      # Post-specific likes/comments tables
├── ios/                             # Capacitor iOS project
├── vitest.config.ts                 # Test configuration
├── capacitor.config.ts              # Capacitor config
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
| `lavuelta.likes` | Likes on activities |
| `lavuelta.comments` | Comments on activities |
| `lavuelta.post_likes` | Likes on text posts |
| `lavuelta.post_comments` | Comments on text posts |
| `lavuelta.follows` | User follow relationships |
| `lavuelta.clubs` | Running clubs (default: La Vuelta Running Club) |
| `lavuelta.club_members` | Club membership with roles |
| `lavuelta.events` | Club events (runs, meetups) |
| `lavuelta.event_participants` | Event RSVPs |
| `lavuelta.posts` | Text + photo social posts (max 500 chars) |
| `lavuelta.saved_routes` | User-saved GPS routes |

### Key Design Decisions

- **Schema isolation**: All tables in `lavuelta` schema, not `public`
- **PostgREST search path**: `PGRST_DB_EXTRA_SEARCH_PATH=lavuelta,public`
- **RLS enabled on all tables** with policies for public read + owner CRUD
- **Auto-profile trigger**: `lavuelta.handle_new_user()` creates a profile row on signup
- **Split likes/comments**: Activity likes use `likes`/`comments` (FK to activities), post likes use `post_likes`/`post_comments` (FK to posts)
- **JSONB route data**: `route_coordinates` stores `{ coordinates, splits, elevation_gain, photos }` in a single JSONB field
- **Photos in content**: Posts embed photo URLs as `[photos:{"url":"..."}]` markers in the content field

### RLS Policies Summary

- **Profiles**: Public read, owner insert/update
- **Activities**: Public read (if public), owner CRUD
- **Likes**: Public read, owner insert/delete
- **Comments**: Public read, owner insert/delete
- **Post Likes**: Public read, owner insert/delete
- **Post Comments**: Public read, owner insert/delete
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
| `lavuelta_activities` | Yes | Activity photos, post photos |

---

## Supabase Configuration

### Self-Hosted Instance

- **URL**: https://supabase.somosdostudio.com
- **VPS**: 62.171.160.75
- **Docker compose**: `/opt/supabase/docker/docker-compose.yml`

### API Keys (stored in `.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://supabase.somosdostudio.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### SSH Commands Reference

```bash
# SSH into VPS
ssh -i C:\Users\Waiha\.ssh\supabasesomos2_ed25519 root@62.171.160.75

# Execute SQL on Supabase
scp -i C:\Users\Waiha\.ssh\supabasesomos2_ed25519 file.sql root@62.171.160.75:/tmp/
ssh -i C:\Users\Waiha\.ssh\supabasesomos2_ed25519 root@62.171.160.75 "docker exec -i supabase-db psql -U postgres -f /tmp/file.sql"
```

---

## Authentication

### Supported Methods

1. **Email/Password** — Standard Supabase auth
2. **Google OAuth** — Configured via Supabase Dashboard > Auth > Providers
3. **Password Recovery** — Email-based reset flow via `/forgot-password`

### Route Protection

The middleware (`src/lib/supabase/middleware.ts`) protects:

- **Protected routes**: `/feed`, `/activities`, `/tracker`, `/profile`, `/settings`, `/stats`, `/routes`
- **Auth pages**: `/login`, `/register` — redirects to `/feed` if already authenticated
- **Public routes**: `/`, `/clubs`, `/events`, `/search`, `/terms`, `/privacy`

---

## Pages & Features

### Landing Page (`/`)
- Hero section with brand imagery (desktop + mobile)
- Animated ticker with brand values ("Nadie corre con ego", etc.)
- Feature preview cards (GPS, Feed, Stats, Club)
- CTA buttons to login/register
- Auto-redirect to `/feed` if authenticated

### Authentication
- **Login** (`/login`): Email/password with show/hide toggle, Google OAuth
- **Register** (`/register`): Full name, username, email, password, Google OAuth
- **Forgot Password** (`/forgot-password`): Email input, sends reset link
- **Reset Password** (`/reset-password`): New password + confirmation

### Social Feed (`/feed`)
- Post creation (textarea, 500 char limit, photo attachments)
- Activity cards with distance, time, pace, type badge
- Text post cards with optional photo grid (1-3 images)
- Like functionality with optimistic UI + bounce animation
- Expandable comment sections
- Delete button on own posts
- User profile links on every card

### GPS Activity Tracker (`/tracker`)
- GPS recording using browser Geolocation API (high accuracy)
- Real-time Leaflet map with live polyline and position marker
- Activity type selector: Run / Walk / Hike
- Pause/Resume/Stop controls
- Live stats: distance, time, pace, cadence, heart rate, elevation gain, max pace
- Kilometer splits with pace comparison
- Haptic feedback on start, km milestones, stop
- Media Session API: lock screen shows CORRIENDO/PAUSADO with stats
- Screen Wake Lock: stays on during tracking
- Screen Lock toggle: prevents accidental touches
- Post-activity: photo upload (1-5 images), save to feed, save as route
- Share via Web Share API or clipboard

### Activity History (`/activities`)
- User's past activities with summary stats
- Total distance, total runs, avg pace, total calories

### Activity Detail (`/activities/[id]`)
- Full-page view with Leaflet map and route polyline
- Detailed stats: distance, time, pace, calories, speed, estimated steps/min
- Kilometer splits table with pace comparison
- Heart rate stats (avg/max) if available
- Elevation gain (D+) if available
- Photo gallery (horizontal scrollable)
- Likes and comments
- Share button

### Training Stats (`/stats`)
- Period filter: Week / Month / Year
- Summary cards: distance, runs, avg pace, calories
- Weekly bar chart (last 8 weeks)
- Running streak with 7-day visual
- Personal records: longest run, fastest pace, best week
- Elevation total for period

### Profile (`/profile`)
- Banner, avatar (upload supported), name, username, bio
- Inline edit mode for profile fields
- Stats grid: total distance, total runs, followers, following
- Info rows: email, location, member since, club

### User Profiles (`/users/[id]`)
- Public profile view for other users
- Follow/Unfollow with optimistic UI
- Stats and recent activities

### Search (`/search`)
- Debounced search (300ms)
- Tabs: Personas / Actividades
- People search: queries full_name and username
- Activity search: queries public activity notes

### Settings (`/settings`)
- Account: email (read-only), password reset link, logout
- Profile editing (name, username, bio, location)
- Notification preferences (push, email)
- About section (version, club info, links)
- Danger zone: account deletion (contact support)

### Clubs (`/clubs`)
- Club listing: user's clubs + discoverable clubs
- Create new club (name, description, auto-slug)
- Club detail: header, members list, join/leave
- Admin badges for club creators

### Events (`/events`)
- Event listing with tabs: Próximos / Mis Eventos / Pasados
- Create event: title, description, date/time, location, distance target, club association
- Event detail: map preview, RSVP buttons (Asistir/Tal vez/No puedo), attendee lists
- Edit event (creator only)

### Saved Routes (`/routes`)
- User's saved routes from activities
- Community routes
- Route detail with Leaflet map, stats, share button

### Error Handling
- `error-boundary.tsx`: React error boundary with dark-themed fallback
- `global-error.tsx`: Root-level error boundary
- `not-found.tsx`: 404 page with "Página no encontrada"

### PWA Features
- Web App Manifest with icons and shortcuts
- Service Worker: stale-while-revalidate caching, precaches 20+ routes
- Push notifications (opt-in via prompt)
- Media Session API for lock screen stats
- Screen Wake Lock during tracking
- Haptic feedback patterns

### Navigation
- Fixed header with logo, settings gear, logout
- Bottom tab bar with 8 tabs: Inicio, Actividades, Grabar (elevated), Eventos, Clubs, Buscar, Rutas, Perfil
- Active state highlighting with accent bar

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase instance URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | Google Maps for event locations |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional | Web Push notifications |

---

## Deployment

### Vercel

- **Production URL**: https://lavuelta-app.vercel.app
- **Account**: `waiharrington`

### Deploy Command

```bash
vercel --prod --yes
```

### Known Deployment Issues

1. **Preview deploys fail**: Env vars only set for `production`. Always deploy with `--prod`.
2. **Middleware Deprecation**: Next.js 16 deprecated `middleware.ts` in favor of `proxy`. Works but should be migrated.
3. **Commit Author Block**: Vercel Hobby plan blocks Git-triggered deploys when commit author lacks access. Use CLI deploys.

### GitHub

- **Repo**: `https://github.com/andreadigitaljobs-arch/la-vuelta-app`
- **Branch**: `master`

---

## What's Left / Next Steps

### Long-term (P3)

1. **Migrate middleware to proxy** — Next.js 16 deprecated `middleware.ts` in favor of `proxy`
2. **Custom domain** — Point `lavuelta.app` to Vercel
3. **Native app (Swift)** — Dynamic Island, lock screen widgets, Health Kit integration
4. **Offline support** — Cache activities for offline tracking
5. **Training plans** — Structured workout programs
6. **Challenges** — Weekly/monthly distance or run-count challenges
7. **Activity replay** — Animated map replay of completed runs
8. **Heart rate sensor integration** — Connect to Bluetooth HR monitors via Web Bluetooth API

---

## Testing

Run tests with:

```bash
npm test
```

Current test coverage:
- `src/lib/__tests__/utils.test.ts` — 23 tests for utility functions
- `src/components/__tests__/error-boundary.test.tsx` — 4 tests for error boundary

---

*Document updated August 27, 2026*
