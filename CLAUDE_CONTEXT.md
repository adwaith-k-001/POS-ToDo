# Claude Project Context — Mark1 / Personal OS

Read this file at the start of every session before touching code.
It is the authoritative reference for this project's architecture, stack, and conventions.

---

## Project Identity

| Field        | Value                                                     |
|-------------|-----------------------------------------------------------|
| Name         | Mark1 — Personal OS                                       |
| Repo         | https://github.com/adwaith-k-001/POS-ToDo.git             |
| Owner        | Adwaith K (adwaithkrishna2005@gmail.com)                  |
| Package name | mark1-temp (temporary — will rename on production rename) |
| Branch       | main                                                      |
| Hosting      | Vercel (not yet deployed as of 2026-06-26)                |
| Database     | Supabase PostgreSQL (project: nitjukyxircheviajsdx)       |
| Auth         | Supabase Auth (email + password only — no OAuth)          |

---

## What This App Is

A personal productivity OS for a single user (multi-account architecture, but no workspaces or team features yet). Features:
- **Tasks** with subtasks, priorities, deadlines, areas, tags, goals, repeat rules
- **Inbox** — tasks with no area assigned
- **Today / Upcoming** — deadline-filtered views
- **Goals** — group tasks under a high-level goal with progress tracking
- **Areas** — life domains (Study, Health, Career, etc.)
- **Tags** — free-form labels
- **Tracker** — daily habit tracker (NUMERIC = log minutes; CHECKBOX = done/not done)
- **Analytics** — completion rates, latency, deadline adherence, area breakdowns, trends
- **Completed / Archived** views

---

## Tech Stack

| Layer            | Technology                      | Version     |
|------------------|---------------------------------|-------------|
| Framework        | Next.js (App Router)            | 16.2.9      |
| Language         | TypeScript                      | 5.x         |
| Styling          | Tailwind CSS                    | v4          |
| UI Components    | shadcn/ui + Radix UI primitives | latest      |
| Icons            | lucide-react                    | latest      |
| Charts           | recharts                        | latest      |
| ORM              | Prisma                          | v7 (7.8.0)  |
| DB Driver        | @prisma/adapter-pg + pg         | 7.8.0 / 8.x |
| Database         | PostgreSQL (Supabase hosted)    | latest      |
| Auth             | Supabase Auth via @supabase/ssr | 0.12.0      |
| Supabase client  | @supabase/supabase-js           | 2.108.2     |
| Date utils       | date-fns                        | latest      |
| Validation       | zod                             | latest      |

---

## Critical Version Gotchas

### Next.js 16
- **`middleware.ts` is deprecated** — use `src/proxy.ts` with `export function proxy(...)` instead.
  See `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- **`cookies()` from `next/headers` is async** — always `await cookies()`.
- Params in dynamic routes are a `Promise` — always `await params`.
- **Always check `node_modules/next/dist/docs/` before writing Next.js-specific code.**

### Prisma v7
- Generator is `provider = "prisma-client"` (not `"prisma-client-js"`).
- Output goes to `src/generated/prisma` — import from `@/generated/prisma/client`.
- Uses driver adapter pattern: `new PrismaPg(connectionString)` — accepts a URL string directly (no Pool object needed).
- `prisma.config.ts` (not `schema.prisma`) controls datasource URL for migrations — uses `DIRECT_URL` (port 5432, bypasses PgBouncer).
- Runtime uses `DATABASE_URL` (port 6543, PgBouncer pooled).
- After any schema change, run `npx prisma generate` to regenerate client.

### Supabase Auth + Prisma
- Supabase owns `auth.users` in a separate schema that Prisma cannot see.
- **There is NO User model in Prisma schema.** Auth is entirely managed by Supabase.
- All models store `userId String` as a plain field (UUID from Supabase), with NO foreign key constraint to auth.users — this is the standard Supabase+Prisma pattern.
- Publishable key env var is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase's new naming for the anon key — it IS public-safe).

---

## Environment Variables

Required in `.env` (never committed — covered by `.gitignore`):

```
NEXT_PUBLIC_SUPABASE_URL=            # Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= # Supabase anon/publishable key (safe to expose)
SUPABASE_SERVICE_ROLE_KEY=           # Server-only admin key (NEVER expose to client)
DATABASE_URL=                        # Pooled PgBouncer URL (port 6543) — used at runtime
DIRECT_URL=                          # Direct Postgres URL (port 5432) — used by Prisma migrations
```

See `.env.example` for the format (no values).

For Vercel deployment, add all 5 vars in the Vercel project settings (Environment Variables tab).

---

## Project Structure

```
Mark1/
├── prisma/
│   ├── schema.prisma              # Database schema (PostgreSQL)
│   ├── migrations/                # Migration history (committed)
│   └── migration_lock.toml
├── prisma.config.ts               # Prisma config — uses DIRECT_URL for migrations
├── src/
│   ├── proxy.ts                   # Next.js 16 route protection (replaces middleware.ts)
│   ├── app/
│   │   ├── layout.tsx             # Root layout (minimal — no auth check here)
│   │   ├── (app)/                 # Protected app group
│   │   │   ├── layout.tsx         # Reads Supabase session; passes userEmail to Sidebar
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── inbox/             # Tasks with no area
│   │   │   ├── today/             # Tasks due today
│   │   │   ├── upcoming/          # Tasks due in future
│   │   │   ├── completed/         # Completed tasks
│   │   │   ├── tasks/[id]/        # Task detail view
│   │   │   ├── areas/             # Area list + [id] detail
│   │   │   ├── tags/              # Tag list + [id] detail
│   │   │   ├── goals/             # Goal list + [id] detail
│   │   │   ├── tracker/           # Habit tracker
│   │   │   └── analytics/         # Analytics dashboard
│   │   ├── (auth)/                # Public auth group (no sidebar)
│   │   │   ├── layout.tsx         # Centered card layout
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── auth/callback/route.ts # Supabase OAuth/email link handler; seeds default habits
│   │   └── api/                   # REST API routes
│   │       ├── tasks/[route.ts, [id]/route.ts]
│   │       ├── areas/[route.ts, [id]/route.ts]
│   │       ├── tags/[route.ts, [id]/route.ts]
│   │       ├── goals/[route.ts, [id]/route.ts]
│   │       ├── analytics/route.ts
│   │       ├── context/route.ts       # GET /api/context → { areas, tags } — one auth call for both
│   │       ├── tracker/[route.ts, entries/route.ts]
│   │       └── user/onboard/route.ts  # Seeds default habits after register
│   ├── components/
│   │   ├── layout/Sidebar.tsx     # Client component; logout button; shows user email
│   │   ├── tasks/                 # TaskCard, TaskForm, TaskList, PriorityBadge, StatusBadge
│   │   └── ui/                    # shadcn/ui primitives
│   ├── services/                  # Business logic — ALL functions take userId as first param
│   │   ├── task.service.ts
│   │   ├── area.service.ts
│   │   ├── tag.service.ts
│   │   ├── goal.service.ts
│   │   ├── analytics.service.ts
│   │   └── tracker.service.ts     # Also exports seedDefaultHabits(userId)
│   ├── hooks/                     # React hooks (useAreas, useTags, useTasks, useGoals, useFormData)
│   ├── lib/
│   │   ├── prisma.ts              # Prisma singleton with PgBouncer adapter
│   │   ├── auth-utils.ts          # getAuthenticatedUser() — used in every API route
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser (client components)
│   │   │   └── server.ts          # Server (RSC / API routes / proxy); exports getCachedUser()
│   │   ├── validations.ts         # Zod schemas
│   │   └── utils.ts               # cn(), formatDate(), isOverdue(), etc.
│   ├── types/index.ts             # Shared TypeScript types
│   └── generated/prisma/          # Auto-generated Prisma client (gitignored)
├── scripts/seed.mjs               # Dev seed script (requires running server; no secrets)
├── CLAUDE_CONTEXT.md              # This file
└── CHANGELOG.md                   # History of all changes
```

---

## How to Run

### Development
```bash
npm install               # install dependencies
npm run dev               # start dev server at http://localhost:3000
```

### Database (Prisma)
```bash
npx prisma generate               # regenerate client after schema changes
npx prisma migrate dev --name X   # create + apply a new migration (uses DIRECT_URL)
npx prisma migrate deploy         # apply pending migrations in production/CI
npx prisma migrate status         # check migration state
npx prisma studio                 # GUI for the database
```

### Build
```bash
npm run build   # production build (TypeScript + lint check)
npm start       # serve production build
```

### Seed dev data (after server is running)
```bash
node scripts/seed.mjs   # creates areas, tags, and sample tasks via API
```

---

## Authentication Flow

1. **Registration (`/register`)**: User submits email + password → `supabase.auth.signUp()`.
   - If Supabase returns a session immediately (email confirmation OFF): `POST /api/user/onboard` seeds default habits.
   - If email confirmation is ON: user confirms email → Supabase redirects to `/auth/callback?code=...` → callback exchanges code, seeds habits, redirects to `/`.
2. **Login (`/login`)**: `supabase.auth.signInWithPassword()`. Supabase sets HTTP-only session cookie.
3. **Session refresh**: `src/proxy.ts` runs on every request and calls `supabase.auth.getSession()` (local cookie decode, ~0 ms). Note: `getUser()` was intentionally replaced with `getSession()` in both the proxy and `getAuthenticatedUser()` to eliminate 200ms+ network round-trips to Supabase auth on every request. The tradeoff is that token revocation isn't detected until JWT expiry (1h). Acceptable for a personal single-user app.
4. **Logout (Sidebar)**: `supabase.auth.signOut()` clears cookie, `router.push('/login')`.
5. **Forgot password (`/forgot-password`)**: `resetPasswordForEmail()` with redirect to `/auth/callback?next=/reset-password`.
6. **Reset password (`/reset-password`)**: User lands here via email link (session established by callback), calls `supabase.auth.updateUser({ password })`.

---

## Data Isolation (Security Model)

Every resource is scoped to a user. Rules:
- Every Prisma model has `userId String` (UUID from Supabase auth).
- Every service function takes `userId` as its first parameter.
- Every Prisma query includes `where: { userId }` (or `where: { id, userId }` for single-record lookups).
- Update/delete use `updateMany`/`deleteMany` with `{ id, userId }` to prevent cross-user writes.
- Every API route calls `getAuthenticatedUser()` from `src/lib/auth-utils.ts` before doing anything. Returns 401 if not authenticated.
- Server pages inside `(app)/` call `supabase.auth.getUser()` and redirect to `/login` if no session.
- `Area` and `Tag` use `@@unique([userId, name])` — same name is allowed across different users.

---

## Database Schema Summary

| Model       | Key Fields                               | Notes                                    |
|-------------|------------------------------------------|------------------------------------------|
| Task        | userId, title, status, priority, deadline, parentTaskId, goalId, areaId | Self-referential subtasks; recurring via recurringParentId |
| Area        | userId, name, color, icon                | @@unique([userId, name])                 |
| Tag         | userId, name, color                      | @@unique([userId, name])                 |
| TaskTag     | taskId, tagId                            | Join table; @@id([taskId, tagId])        |
| Goal        | userId, title, color, status, targetDate |                                          |
| TaskHistory | taskId, action, oldValue, newValue       | Audit log per task; no userId (via task) |
| Habit       | userId, name, type, target, order        | type: NUMERIC or CHECKBOX                |
| HabitEntry  | habitId, date, value                     | @@unique([habitId, date])                |

Default habits seeded per user on first login: Reading (30 min), Learning (30 min), Studying (120 min), Exercise (30 min), Sleep (checkbox).

---

## Deployment (Vercel)

1. Push to GitHub (`origin` = https://github.com/adwaith-k-001/POS-ToDo.git)
2. Import repo in Vercel dashboard
3. Add all 5 env vars (see Environment Variables section above)
4. Vercel auto-detects Next.js; no build config needed
5. `npm run build` is the build command (already set by Vercel)
6. **Region**: `vercel.json` sets `"regions": ["hnd1"]` (Tokyo) to match Supabase `ap-northeast-1`. Reduces auth + DB latency from ~200 ms (US East default) to ~20 ms.

**Supabase Auth redirect URLs to configure in Supabase dashboard:**
- Site URL: `https://your-vercel-domain.vercel.app`
- Redirect URLs: `https://your-vercel-domain.vercel.app/auth/callback`

---

## Things to Know / Watch Out For

- `prisma.config.ts` already sets `datasource.url` to `DIRECT_URL` for migrations. Do not change this to `DATABASE_URL` or migrations through PgBouncer will fail.
- `src/generated/prisma/` is gitignored. After cloning, always run `npx prisma generate` before `npm run dev`.
- The seed script (`scripts/seed.mjs`) hits the running API, so the server must be running and the user must be logged in (the API requires auth). It's meant for dev population, not CI.
- Sidebar is `"use client"` (needs `useRouter` for logout), but `userEmail` is passed from the server layout so there's no client-side session fetch in the sidebar.
- `Area.tasks` in `getAreaById` returns non-archived tasks only (filtered in service). The `_count` reflects ALL tasks (including archived).
- PostgreSQL mode: `mode: "insensitive"` is used in `contains` searches for case-insensitive matching.
- **`getAnalyticsSummary`** calls 5 sub-functions in `Promise.all`. `getOverviewStats` uses a single `$queryRaw` with `FILTER` aggregation — do not revert to multiple `prisma.task.count()` calls as that causes PgBouncer queue contention (measured: 5 parallel counts = ~1173 ms vs single query = ~155 ms).
- **`PATCH /api/tasks/[id]`** returns the full task with history (calls `getTaskById` after `updateTask`). This is intentional — `TaskDetailClient` uses the PATCH response directly and does not make a second GET. Do not remove the `getTaskById` call from the PATCH handler.
- **`getMonthEntries`** accepts an optional `knownHabitIds` parameter. Always pass `habits.map(h => h.id)` when you already have the habits (as `tracker/route.ts` does) to avoid a redundant DB round-trip.
- **Performance measurement**: run `node --env-file=.env scripts/perf-test.mjs` to re-measure Supabase auth latency, PgBouncer round-trip, and query patterns after any change.
- **Database indexes** (as of migration `20260626014249`): Task has indexes on `(userId)`, `(userId,status)`, `(userId,deadline)`. Goal/Habit have `(userId)`. TaskHistory has `(taskId)`. Do not add queries that filter on `Task.userId` without one of these covering indexes.

### Auth patterns — important

- **In server components (RSC)**: use `getCachedUser()` from `@/lib/supabase/server`. It is wrapped in `React.cache()` and deduplicates the `getUser()` network call across layout + page within a single render. Do NOT call `createClient()` + `getUser()` directly in pages.
- **In API routes**: use `getAuthenticatedUser()` from `@/lib/auth-utils`. `React.cache()` does not apply in route handlers so the per-route call is unavoidable and correct.
- **In `proxy.ts`**: uses `getSession()` (local cookie read, no network). Sufficient for redirect decisions. Full JWT verification happens in API routes.
- **Do not add `force-dynamic`** to pages that call `getCachedUser()` / `createClient()` — `await cookies()` already makes them dynamic. `force-dynamic` zeroes the client-side Router Cache TTL, killing fast re-navigation.

### Client-side data fetching patterns

All hooks use **SWR** (`swr@2.4.2`). The shared fetcher is at `src/lib/fetcher.ts`. Global config is in `src/app/(app)/SWRProvider.tsx` (wraps the app layout).

- **`useFormData()`** (`src/hooks/useFormData.ts`): fetches `{ areas, tags }` in one request from `GET /api/context`. Use this wherever you need areas + tags only for `TaskForm` dropdowns (no CRUD). Currently used in: `TaskList`, `UpcomingPage`, `TaskDetailClient`, `GoalDetailPage`. SWR deduplicates concurrent calls to the same endpoint — only one in-flight request even when multiple components call this hook.
- **`useAreas()` / `useTags()`**: retain full CRUD methods. Use only in components that create/update/delete areas or tags (`AreasClient`, `TagsClient`).
- Do not call `useAreas()` + `useTags()` together — use `useFormData()` instead to avoid duplicate API calls.
- **Mutations**: all mutation functions (`createTask`, `updateArea`, etc.) call `mutate()` after the API call for background revalidation — the list updates without showing a loading state. `keepPreviousData: true` on `useTasks` prevents the list from going blank when filter parameters change.
