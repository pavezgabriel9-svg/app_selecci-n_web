# Project Memory: app_seleccion_web

## Tech Stack
- Next.js 16.1.6 (Turbopack), React 19, TypeScript strict
- Supabase (Postgres + Auth), @supabase/ssr + @supabase/supabase-js v2.97+
- Tailwind CSS v4, shadcn/ui (new-york), Zod v4, lucide-react

## Key Patterns
- Auth middleware: `proxy.ts` at root (Next.js 16 uses this directly — no `middleware.ts` needed)
- Supabase clients: `lib/supabase/server.ts` (createClient, createServiceClient), `lib/supabase/client.ts`
- Server actions with `useActionState`: bind extra args with `.bind(null, arg)` to match `(prevState, formData)` signature
- After server action success in client component, call `router.refresh()` to revalidate server component data

## Known Gotchas
- Zod v4 uses `.issues` not `.errors` on ZodError
- Database type for @supabase/supabase-js v2.97+ requires: `Views`, `Functions`, `Enums`, `CompositeTypes`, and `Relationships[]` per table — see `types/database.ts`
- `tests.id` is TEXT (not UUID): 'hanoi-medio', 'hanoi-dificil', 'ic', 'memoria', 'stroop', 'luscher'

## Design System ("Clinical-Luxury")
- Colors: `var(--navy)` (deep navy), `var(--cream)` (warm cream), `var(--gold)` (golden amber)
- Fonts: Fraunces (headings via `font-family: var(--font-fraunces)`), Sora (body), Geist Mono
- Utilities: `.gold-line`, `.bg-admin-gradient`, `.text-gold`, `.noise-texture`, `.transition-base`
- Status colors: completed=#2D9E6B, in_progress=var(--gold), pending=oklch(0.70 0 0)

## Project Structure (Etapa 2 complete)
- `app/(admin)/dashboard/` — stats + recent sessions
- `app/(admin)/baterias/` — list, nueva (form), [id] (detail + evaluations)
- `app/(auth)/login/` — login form + server actions
- `components/admin/` — sidebar, topbar
- `supabase/migrations/001_initial_schema.sql` — full schema

## Etapas Progress
- Etapa 1 (Auth + Layout): DONE
- Etapa 2 (Panel Admin — Baterías + Evaluaciones): DONE
- Etapa 3 (Candidate eval flow at /eval/[token]): PENDING
- Etapa 4 (Resultados page): PENDING
