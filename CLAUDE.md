# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

No test runner is configured.

## Environment

Requires `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

## Architecture

Next.js 16 App Router + Supabase (PostgreSQL + Auth). TypeScript throughout.

### Route Groups

- `app/(auth)/login/` — Public login page (Supabase email/password)
- `app/(admin)/` — Protected admin routes; require authenticated user
  - `dashboard/` — Stats overview
  - `baterias/` — Battery management (create, view, generate eval links)
  - `resultados/` — Session results with search and CSV export
- `app/(eval)/eval/[token]/` — Public candidate-facing evaluation
  - `page.tsx` — Intake form (name + RUT)
  - `[testId]/page.tsx` — Test runner
  - `gracias/` — Completion page

### Server Actions

All mutations use Next.js Server Actions (`'use server'`), not API routes:

- `app/(auth)/login/actions.ts` — `loginAction`, `logoutAction`
- `app/(admin)/baterias/actions.ts` — `createBatteryAction`, `deleteBatteryAction`, `createEvaluationAction`
- `app/(eval)/eval/actions.ts` — `startEvaluationAction`, `completeTestAction`

### Supabase Clients

Two clients in `lib/supabase/server.ts`:
- `createClient()` — Cookie-based SSR client; respects RLS; used for admin routes
- `createServiceClient()` — Service role; bypasses RLS; used in eval actions because candidates are unauthenticated

### Database Schema

Tables: `tests` (seed data, fixed catalog), `batteries`, `battery_tests`, `evaluation_sessions`, `candidates`, `test_results`. Full types in `types/database.ts`.

Key design: `evaluation_sessions.tests_snapshot` (JSONB array) captures the ordered test list at session creation time, so battery changes don't affect in-progress evaluations.

Session lifecycle: `pending` → `in_progress` (after intake form) → `completed` (after last test).

### Tests

Six psychology tests as `'use client'` React components in `components/tests/`:
- `hanoi.tsx` — Tower of Hanoi (cognitive; two difficulty variants). During gameplay renders a full-screen overlay (`position: fixed; inset: 0`) that escapes the `max-w-xl` eval layout. Disc widths are percentage-based (responsive). Result screen shows only a thank-you message — scores are not shown to the candidate.
- `ic.tsx` — Inventario de Capacidades (aptitude; 25 items, 7 min timer)
- `stroop.tsx` — Stroop color-word test (attention)
- `memoria.tsx` — Memory sequence recall
- `luscher.tsx` — Lüscher color preference (4 steps in a single component)

Each receives `{ onComplete: (results: TestResultData) => void, isPending: boolean, hasPractice: boolean }` from the test runner page. `HanoiTest` additionally receives `variant: 'medio' | 'dificil'` and `candidateName?: string`. Result types are defined in `types/database.ts`.

### Evaluation Flow

1. Admin creates a battery → generates a UUID token link via `createEvaluationAction`
2. Candidate opens `/eval/[token]` → enters name + RUT (Chilean checksum validated in `startEvaluationAction`)
3. `startEvaluationAction` inserts `candidates` record, sets session to `in_progress`, redirects to first test
4. `completeTestAction` saves each `test_results` row and redirects to next test or `/gracias`
5. Anti-skip: position is determined by counting saved `test_results` rows, not trusting client state

### UI

shadcn/ui components (Radix primitives + Tailwind v4). Fonts: Fraunces (display), Sora (body), Geist Mono. Add new components with `npx shadcn@latest add <component>`.
