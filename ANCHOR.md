---
progress: 55
status: In Progress
next: Build Student Management (Task 6) — student CRUD, class assignment, list with search/filter — then Fee Collection, pixel-matched to the user's reference mockup screens.
goal: Ship Phase 1 of School OS — a multi-tenant school accounting SaaS (fees, expenses, salary, cash book, ledger, reports) for schools across India, starting with Module 1 (Auth + School Management)
---

**Tech stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage). Deployed on Vercel at https://school-os-blue.vercel.app.

**Module 1 (Auth + School Management) is DONE — verified live in production, not just locally:**
- Repo: https://github.com/Volcano7887/-school-os (git initialized this session; excel files with real student names and the reference mockup image are gitignored — never committed, contain PII).
- Deployed to Vercel, connected to GitHub for auto-deploy on push. Env vars set in Vercel dashboard.
- User created their own login manually (Supabase dashboard → Authentication → Users — no public signup by design), logged in, created their first real school via `/onboarding`, and confirmed the full authenticated dashboard renders correctly (sidebar, school switcher, stat tiles, account menu) in production.

**Two real bugs found and fixed post-deploy (both live now):**
1. **Stale `/dashboard` redirects**: login, password reset, the auth callback default, and the "already logged in" middleware check all still pointed at the old flat `/dashboard` route from before the Task 5 `[schoolSlug]` restructure — caused a 404 right after login in production. Fixed by grepping for every hardcoded `/dashboard` and pointing them at `/` (the school-resolving root) instead.
2. **RLS blocked reading back a just-created school**: `createSchool` inserts a school then immediately selects it back to get its id/slug — but the `schools_select` policy only allowed rows where the user is already a *member*, and the `school_users` row doesn't exist yet at that point in the same action. Fixed via a new migration allowing `created_by = auth.uid()` as an alternate select condition, applied directly via `supabase db push` (CLI is now fully working — see below).

**Supabase CLI is now fully functional**: connection string stored in `.env.local` as `SUPABASE_DB_URL` (server-only, gitignored). `supabase db push --db-url "$SUPABASE_DB_URL"` applies migrations directly — no more manual SQL Editor pasting needed for future modules.

**UI direction** (locked in from user's reference mockup, see prior notes): dark navy sidebar, colored icon-chip stat tiles, breadcrumbs, real topbar (working theme toggle, honest empty states for search/notifications pending real data). Reference implementation at `/style-guide` (public, dev-only, remove before real launch).

**Still open / housekeeping:**
- `/style-guide` route is public in production right now — fine for now (no real data exposed) but should be removed or auth-gated before any real launch.
- Only one Vercel env var set so far was confirmed (`NEXT_PUBLIC_SITE_URL` etc.) — worth double-checking `NEXT_PUBLIC_SITE_URL` exactly matches `https://school-os-blue.vercel.app` for password-reset links in prod.
- `database.types.ts` is still hand-written (Docker/Podman not installed, blocks real `supabase gen types`) — low priority, works fine as-is.

**Next module: Student Management**, then **Fee Collection** — pixel-matched to the user's reference screens (search-by-student, collection form with running balance, receipt) since that's the module she'll actually use daily.

**Worth remembering:** user is a working school accountant building this as a real product, not a toy — wants pixel-fidelity to her reference mockups, and moves fast/expects action over lengthy back-and-forth. Full context in `.claude` memory (`user_role.md`, `project_scope.md`).
