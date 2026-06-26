# Changelog — Mark1 / Personal OS

All significant changes to this project are documented here in reverse-chronological order.
Format: `## [Date] [Time IST] — Title` followed by what changed and why.

---

## [2026-06-26] — Performance: Eliminate Auth Overhead and Redundant API Calls

**Reason**: Deployed app had ~1 s navigation delay and 1–2 s data load time caused by redundant Supabase auth network calls, disabled client-side caching, and unnecessary parallel API requests.

### Authentication overhead — removed

- `src/proxy.ts`: Switched from `supabase.auth.getUser()` to `supabase.auth.getSession()`. `getUser()` makes an outbound HTTP request to Supabase on every request (page navigations and every API call). `getSession()` reads the session from the cookie locally (~0 ms). The proxy only needs to know if a session exists for redirect decisions; full server-side JWT verification still happens in every API route via `getAuthenticatedUser()`.
- `src/lib/supabase/server.ts`: Added `getCachedUser()` — a `React.cache()`-wrapped function that deduplicates the `getUser()` network call within a single RSC render. Previously `(app)/layout.tsx` and each `page.tsx` each created a new Supabase client and called `getUser()` independently (2–3 network calls per page). Now both share the same memoized result (1 call).
- All server-component pages updated to use `getCachedUser()` instead of `createClient()` + `getUser()`:
  - `src/app/(app)/layout.tsx`
  - `src/app/(app)/page.tsx` (Dashboard)
  - `src/app/(app)/analytics/page.tsx`
  - `src/app/(app)/tracker/page.tsx`
  - `src/app/(app)/areas/page.tsx`
  - `src/app/(app)/tags/page.tsx`
  - `src/app/(app)/tasks/[id]/page.tsx`
  - `src/app/(app)/areas/[id]/page.tsx`
  - `src/app/(app)/tags/[id]/page.tsx`
- Net reduction: 3 → 1 Supabase `getUser()` network calls per server-component page request; 2 → 1 per API call.

### `force-dynamic` removed from pages where it was redundant

All of these pages call `getCachedUser()` → `createClient()` → `await cookies()`, which already opts them into dynamic rendering regardless of the flag. The actual cost of `force-dynamic` is zeroing the Next.js Router Cache TTL (client-side cache). Removing it restores the default 30 s TTL, so re-navigating to a recently visited page within a session is served from cache instantly.

Removed from: `page.tsx`, `analytics/page.tsx`, `tracker/page.tsx`, `areas/page.tsx`, `tags/page.tsx`.

### Client-side API consolidation

- Added `src/app/api/context/route.ts` — `GET /api/context` returns `{ areas, tags }` in one authenticated request (one `getUser()` call, one Prisma query per resource in parallel).
- Added `src/hooks/useFormData.ts` — replaces the `useAreas()` + `useTags()` pair in components that only need form dropdown data (not CRUD).
- Updated `TaskList`, `UpcomingPage`, `TaskDetailClient`, `GoalDetailPage` to use `useFormData()`. Pages that previously made 3 parallel client-side API calls on mount (tasks + areas + tags) now make 2 (tasks + context).
- `useAreas` and `useTags` hooks retained unchanged for `AreasClient` and `TagsClient` which need full CRUD operations.

### Hard navigation replaced

- `src/app/(app)/goals/[id]/page.tsx` (subtask rows): replaced `window.location.href = '/tasks/...'` with `router.push('/tasks/...')`. The hard navigation was triggering a full page reload on every subtask click, bypassing the SPA router, discarding cached state, and paying the full cold-start cost again.

### Build verification
- `npm run build` passes with zero TypeScript errors across all 33 routes.
- New route `/api/context` appears in the route table as `ƒ` (dynamic).

---

## [2026-06-26] — Production Migration: Supabase Auth + PostgreSQL

**Session duration**: Multi-session (two Claude Code conversations)
**Reason**: Migrate from local-only SQLite prototype to a production-ready full-stack app with user authentication.

### Authentication
- Added Supabase Auth as the sole authentication provider (email + password only — no OAuth).
- Added `src/lib/supabase/client.ts` — `createBrowserClient` for client components.
- Added `src/lib/supabase/server.ts` — `createServerClient` for server components and API routes.
- Added `src/lib/auth-utils.ts` — `getAuthenticatedUser()` helper used in all API routes; returns 401 if unauthenticated.
- Added `src/proxy.ts` — Next.js 16 route protection (replaces deprecated `middleware.ts`). Redirects unauthenticated users to `/login`, redirects authenticated users away from auth pages.
- Added `src/app/(auth)/` group layout + four auth pages: login, register, forgot-password, reset-password.
- Added `src/app/auth/callback/route.ts` — handles Supabase email link redirects; exchanges code for session; seeds default habits on first login.
- Added `src/app/api/user/onboard/route.ts` — idempotent habit seeding for immediate-session registrations (no email confirmation flow).

### Database
- Switched from SQLite (`better-sqlite3`) to PostgreSQL (Supabase hosted).
- Removed `@prisma/adapter-better-sqlite3`, `better-sqlite3`, `@types/better-sqlite3`.
- Added `@prisma/adapter-pg`, `pg`, `@types/pg`.
- Removed old SQLite migrations (`20260618093208_init`, `20260618201726_add_goals`).
- Created new clean PostgreSQL migration: `prisma/migrations/20260625233805_init_postgresql/`.
- Updated `prisma.config.ts` to use `DIRECT_URL` (direct Postgres connection) for migrations, bypassing PgBouncer.
- Updated `src/lib/prisma.ts` — replaced BetterSQLite adapter with `PrismaPg(connectionString)`.

### Schema Changes
- Added `userId String` field to: Task, Area, Tag, Goal, Habit.
- Changed `Area.name @unique` → `@@unique([userId, name])` — allows same area name across different users.
- Changed `Tag.name @unique` → `@@unique([userId, name])` — same rationale.
- Removed hardcoded default habits from migration SQL; moved to `seedDefaultHabits(userId)` function called at signup/login.

### Services — Data Isolation
All service functions refactored to take `userId: string` as their first parameter. Every Prisma query now includes `where: { userId }`. Single-record lookups use `findFirst({ where: { id, userId } })` instead of `findUniqueOrThrow(id)` to prevent cross-user access:
- `src/services/task.service.ts`
- `src/services/area.service.ts`
- `src/services/tag.service.ts`
- `src/services/goal.service.ts`
- `src/services/analytics.service.ts`
- `src/services/tracker.service.ts` (new file — moved from inline tracker code; added `seedDefaultHabits`)

### API Routes — Auth Guard
All API routes updated to call `getAuthenticatedUser()` and pass `userId` to service functions:
- `src/app/api/tasks/route.ts`
- `src/app/api/tasks/[id]/route.ts`
- `src/app/api/areas/route.ts`
- `src/app/api/areas/[id]/route.ts`
- `src/app/api/tags/route.ts`
- `src/app/api/tags/[id]/route.ts`
- `src/app/api/goals/route.ts`
- `src/app/api/goals/[id]/route.ts`
- `src/app/api/analytics/route.ts`
- `src/app/api/tracker/route.ts`
- `src/app/api/tracker/entries/route.ts`

### App Layout + Sidebar
- `src/app/(app)/layout.tsx` — now async server component; reads Supabase session; passes `userEmail` to Sidebar; redirects to `/login` if no session.
- `src/components/layout/Sidebar.tsx` — added `userEmail` prop; shows user avatar (email initial); added logout button (`supabase.auth.signOut()` + redirect).

### Server Pages
All SSR pages in `(app)/` updated to get userId from Supabase and pass it to service calls:
- `page.tsx` (Dashboard)
- `analytics/page.tsx`
- `areas/page.tsx`, `areas/[id]/page.tsx`
- `tags/page.tsx`, `tags/[id]/page.tsx`
- `tasks/[id]/page.tsx`
- `tracker/page.tsx`

### Build Verification
- `npm run build` passes with zero TypeScript errors across all 32 routes.
- Prisma client regenerated (`npx prisma generate`) after schema changes.
- Migration applied to Supabase via `npx prisma migrate deploy` (initial migration had failed mid-run due to connection drop; resolved with `prisma migrate resolve --rolled-back` then re-deployed).

---

## [2026-06-19 02:00 IST] — Goals, Completed View, Upcoming Date Filter

**Commit**: `ea72ab4`
**Reason**: Extend the task manager with goal tracking and improve task views.

### Added
- **Goal model** in Prisma schema: title, description, color, icon, status (ACTIVE/COMPLETED/ARCHIVED), targetDate.
- **Goals pages**: `/goals` list view + `/goals/[id]` detail with linked tasks.
- **GoalsClient**: create/edit/delete goals; link tasks to goals.
- **Completed view** (`/completed`): shows all tasks with status COMPLETED.
- **Upcoming filter**: tasks with `dueAfter` / `dueBefore` query params — used by dashboard "Upcoming (7 days)" panel.
- **Goal filter** in task queries: `goalId` param on `/api/tasks` route.
- Migration `20260618201726_add_goals` (SQLite — later deleted in PostgreSQL migration).

---

## [2026-06-19 01:27 IST] — Initial Commit: POS-ToDo Task Manager

**Commit**: `deb5dec`
**Reason**: First working version of the personal task manager built on Next.js + SQLite.

### Stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- Prisma v7 with SQLite (`better-sqlite3`)
- No authentication — single-user local app

### Features
- **Tasks**: create, edit, archive, delete; priorities (LOW/MEDIUM/HIGH/URGENT); deadlines; subtasks (self-referential); recurring tasks (DAILY/WEEKLY/MONTHLY/YEARLY); task history audit log.
- **Areas**: life domains with color + emoji icon; tasks linked to areas.
- **Tags**: free-form labels with color; many-to-many with tasks via TaskTag join table.
- **Inbox**: tasks with no area assigned.
- **Today**: tasks due today.
- **Tracker**: habit tracker with NUMERIC (minutes) and CHECKBOX types; per-day entry log.
- **Analytics**: overview stats, latency stats, deadline adherence, per-area breakdown, 30-day trends chart (recharts).
- **Sidebar**: navigation with active state highlighting; coming-soon placeholders for future features.
- **TaskList component**: reusable filtered task list with inline create form.
- **TaskForm**: full task creation/editing dialog with area, tag, goal, deadline, repeat pickers.
- Dev seed script at `scripts/seed.mjs`.

---

## [2026-06-19 01:24 IST] — Repository Initialized

**Commit**: `31f570f`
**Reason**: `create-next-app` scaffold.
