---
progress: 45
status: In Progress
next: User needs to create their first Supabase Auth login (Dashboard → Authentication → Users → Add user), then log in and create their first real school via /onboarding to test the full flow end-to-end. After that, Module 1 (Auth + School Management) is fully done — next is Dashboard → Student Management → Fee Collection.
goal: Ship Phase 1 of School OS — a multi-tenant school accounting SaaS (fees, expenses, salary, cash book, ledger, reports) for schools across India, starting with Module 1 (Auth + School Management)
---

**Tech stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage), deployed on Vercel.

**Module 1 (Auth + School Management) is functionally complete:**
- Auth: login, logout, forgot/reset password, session refresh via `src/proxy.ts` (this Next.js version renamed `middleware.ts` → `proxy.ts` — documented in AGENTS.md).
- Schema live in Supabase: `schools`, `profiles`, `school_users`, `academic_years`, all RLS-protected. CLI `db push`/`migration repair` now work (connection string in `.env.local` as `SUPABASE_DB_URL`, server-only).
- **School-scoped routing**: everything under `app/(dashboard)/[schoolSlug]/...`. Root `/` resolves the user's schools and redirects to their first one's `/​{slug}/dashboard`, or to `/onboarding` if they have none. The `[schoolSlug]/layout.tsx` verifies real membership (not just auth) before rendering, and feeds real user/school data into the shell.
- **School switcher**: dropdown in the sidebar (desktop) and in the mobile "More" sheet, listing every school the user belongs to, plus "Add school" → `/onboarding`. Create-school flow (`features/schools/actions.ts`) handles slug generation/collisions and auto-adds the creator as `school_admin`.
- **UI direction locked from a user-provided reference mockup** and matched closely, verified live: dark navy sidebar (fixed brand element, independent of light/dark mode), primary buttons in that same navy, colored icon-chip stat tiles (green/red/blue/orange/purple), breadcrumbs, real topbar (search input — chrome only, disabled — theme toggle that actually works via next-themes, notification bell with an honest "No notifications yet" empty state, avatar dropdown with real name/email/role + sign out). Reference implementation permanently viewable at `/style-guide` (public dev-only route, not linked in nav, remove before shipping).
- Reusable components: `stat-card.tsx`, `breadcrumb.tsx`, `school-switcher.tsx`, `account-menu.tsx`, `topbar.tsx`, `theme-toggle.tsx`.

**Explicitly deferred** (per user's own "100%" reference, but these need real data to not be fake decoration): actual working search results, real notifications, Cash Flow / Income-vs-Expense charts, and the Fee Collection / Add Expense / Reports / Student Profile screens from the reference — those get pixel-matched against the same reference when we build the Fee Collection, Expense Management, Reports, and Student Management modules, in that order, since their schema doesn't exist yet.

**Still open before Module 1 is 100% done:**
1. User creates their own Supabase Auth login (dashboard → Authentication → Users → Add user, "Auto Confirm User" on) — no public signup by design.
2. Also set Supabase Authentication → URL Configuration: Site URL `http://localhost:3000`, redirect URL `http://localhost:3000/auth/callback` (needed for password reset).
3. Log in, create first real school via onboarding, confirm the whole flow end-to-end (currently only verified via the public `/style-guide` demo route, not a real authenticated session).

**Worth remembering:** user is a working school accountant building this as a real product, not a toy — feature/UX decisions should reflect real accounting workflows she knows firsthand, and she wants pixel-fidelity to her reference mockups, not simplified approximations. Full context in `.claude` memory (`user_role.md`, `project_scope.md`).
