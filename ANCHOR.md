---
progress: 96
status: In Progress
next: User said UI "looks shit" vs reference mockups and wants everything matched — worked through Dashboard/Students/Reports gaps in a batch (see below), user needs to test this batch live. ONE deliberately-deferred item remains: converting the Fee Collection dialog into a dedicated full page (matching reference exactly) — flagged as the highest-risk change since the dialog flow is already tested/working, so it's being done last and carefully, not bundled into this batch.
goal: Ship Phase 1 of School OS — a multi-tenant school accounting SaaS (fees, expenses, salary, cash book, ledger, reports) for schools across India, starting with Module 1 (Auth + School Management)
---

**Tech stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage). Deployed on Vercel at https://school-os-blue.vercel.app, repo at https://github.com/Volcano7887/-school-os.

**Every module from the original Phase 1 list has a real, working page.** `npm run build` runs before every push now (a real Vercel 404 earlier turned out to be exactly the kind of thing `tsc`+`eslint` alone miss) — that discipline held through this whole session's large batch of changes with zero build failures.

**Confirmed working live (user tested):** Auth, School Management, Student Management, Fee Collection, Expense Management, Salary Management, Cash Book, Ledger.

**Shipped, NOT yet tested live:** Dashboard, Reports, Bills, Audit Log, Settings, and this session's whole UI-matching batch (see below).

**UI-matching pass against the user's reference mockups** (user said the UI "looks shit" compared to the reference and wanted everything matched — this was a real, substantive gap, not just taste):
1. **Dashboard**: Cash Flow line chart (6mo, CVD-validated), Recent Transactions feed, plus a second row — **Upcoming Fee Due** (top students by balance, links to their profile) and **Recent Expenses** — matching the reference's 2x2 panel layout exactly.
2. **Add Expense**: real image thumbnail preview of the uploaded bill (object URL, properly revoked).
3. **Fee Collection dialog**: redesigned to split-panel (student info + Total Due on left, Collection Details + live-recalculating Summary on right), added a real "Save & Print Receipt" action.
4. **Students list**: avatar circles, inline color-coded Due amount (computed the same way as Fee Collection), and an "All Status" (Due/Clear) filter alongside the class filter.
5. **Reports**: 4 quick-report shortcut cards (real navigation to relevant sections, not fabricated separate report engines), a daily Income vs Expense bar chart for the current month, a Top Expense Categories donut chart with legend+percentages (6-color categorical palette, took 3 iterations through the dataviz skill's CVD validator to pass), and a real "Export Report" CSV download.

**Deliberately deferred, not forgotten**: converting Fee Collection from a dialog to the reference's dedicated full-page layout (search-first, single-student focus). This is the biggest remaining structural gap and the highest regression risk (the dialog flow is tested and confirmed working), so it's being done as its own careful pass rather than rushed into this batch.

**Also shipped this session (before the UI-matching batch)**: printable fee receipts, WhatsApp click-to-send for receipts and fee reminders (English/Hindi/Hinglish) — zero-cost, chosen deliberately over SMS/WhatsApp-API after explaining the real setup/cost tradeoffs to the user.

**Accounting core**: chart of accounts + double-entry journal; `record_fee_payment`, `record_expense`, `record_salary_payment` all post atomically via SECURITY DEFINER Postgres functions and write an audit log row in the same transaction.

**Real test data**: 72 real students imported from the user's actual Boys school Excel, real per-class tuition amounts, 13 real historical transactions reconstructed as balanced journal entries.

**Known simplifications (deliberate):**
- No academic-year switcher UI — only ever shows the current year.
- `/style-guide` route still public — remove/gate before real launch.
- `database.types.ts` still hand-written (Docker/Podman not installed) — now covers 15 tables + 3 RPC functions; worth revisiting Docker install soon.
- Parent notifications are manual-send (click-to-send WhatsApp links), not automatic — deliberate cost/complexity tradeoff.
- Reports' 4 "quick report" shortcuts are real navigation, not 4 distinct report engines — building fake distinct reports would have been worse than being upfront about this.

**Worth remembering:** user is a working school accountant building this as a real product — wants pixel-fidelity to her reference mockups, and pushed back hard when a batch of work didn't close the gap enough ("UI looks shit" x2) — take reference-matching literally and thoroughly, not just the obviously-easy pieces. Also explicit about wanting zero-cost solutions (rejected Firebase/SMS/WhatsApp-API for parent messaging once real tradeoffs were explained). Moves fast, expects action over lengthy back-and-forth. Full context in `.claude` memory (`user_role.md`, `project_scope.md`).
