---
progress: 97
status: In Progress
next: User needs to live-test the Fee Collection page conversion (dialog -> full page) especially carefully, since it's the biggest structural change this session and retired a previously-working, tested component. Test: search finds students by name/admission no./phone, clicking a search result or a "Collect" row button opens the same inline panel, Save Collection / Save & Print Receipt both still work, Cancel clears the selection. Also still need to test the rest of this session's UI-matching batch (Dashboard panels, Students list, Reports charts).
goal: Ship Phase 1 of School OS — a multi-tenant school accounting SaaS (fees, expenses, salary, cash book, ledger, reports) for schools across India, starting with Module 1 (Auth + School Management)
---

**Tech stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage). Deployed on Vercel at https://school-os-blue.vercel.app, repo at https://github.com/Volcano7887/-school-os.

**Every module from the original Phase 1 list has a real, working page.** `npm run build` runs before every push (a real Vercel 404 earlier turned out to be exactly the kind of thing `tsc`+`eslint` alone miss) — held through this session's entire large UI-matching batch with zero build failures.

**Confirmed working live (user tested):** Auth, School Management, Student Management, Expense Management, Salary Management, Cash Book, Ledger. Fee Collection was confirmed working in its *dialog* form earlier in the session — it has since been restructured into a full page (see below) and needs re-testing.

**UI-matching pass — complete, all 4 items** (user said the UI "looks shit" vs. the reference mockups and wanted everything matched; this was a real, substantive gap, not just taste):
1. **Dashboard**: Cash Flow line chart (CVD-validated) + Recent Transactions, plus a second row — Upcoming Fee Due + Recent Expenses — matching the reference's 2x2 panel layout.
2. **Students list**: avatar circles, inline color-coded Due amount, an "All Status" (Due/Clear) filter.
3. **Reports**: quick-report shortcut cards (real navigation, not fabricated report engines), a daily Income vs Expense bar chart, a Top Expense Categories donut (6-color categorical palette, took 3 iterations through the dataviz skill's CVD validator), a real CSV export.
4. **Fee Collection — converted from dialog to dedicated full page**, the biggest and riskiest change: search-first entry point (name/admission no./phone, live suggestions) → same split-panel Collection Details + live Summary as before, now inline instead of modal. Kept the full browse-all-students table below (not in the reference, but real value) — both the search and the table's "Collect" button feed the same single collection panel. `record-payment-dialog.tsx` retired entirely, replaced by `fee-collection-panel.tsx` + `fee-collection-workspace.tsx`.
5. **Add Expense** (done earlier in the batch): real image thumbnail preview of the uploaded bill.

**Also shipped this session (before the UI-matching batch)**: printable fee receipts, WhatsApp click-to-send for receipts and fee reminders (English/Hindi/Hinglish) — zero-cost, chosen deliberately over SMS/WhatsApp-API after explaining real setup/cost tradeoffs to the user; real Boys-school Excel data import (72 students, real tuition amounts, 13 real historical transactions as balanced journal entries); Bills, Audit Log, Settings modules.

**Accounting core**: chart of accounts + double-entry journal; `record_fee_payment`, `record_expense`, `record_salary_payment` all post atomically via SECURITY DEFINER Postgres functions and write an audit log row in the same transaction.

**Known simplifications (deliberate):**
- No academic-year switcher UI — only ever shows the current year.
- `/style-guide` route still public — remove/gate before real launch.
- `database.types.ts` still hand-written (Docker/Podman not installed) — now covers 15 tables + 3 RPC functions; worth revisiting Docker install soon, it's getting large.
- Parent notifications are manual-send (click-to-send WhatsApp links), not automatic.
- Reports' quick-report shortcuts are real navigation, not 4 distinct report engines.
- Fee Collection's browse-all-students table isn't in the reference mockup — kept anyway since browsing everyone's dues is real accounting value, reference was single-student-search-only.

**Worth remembering:** user is a working school accountant building this as a real product — wants pixel-fidelity to her reference mockups, and pushed back hard when a batch of work didn't close the gap enough ("UI looks shit" x2) — take reference-matching literally and thoroughly. Also explicit about wanting zero-cost solutions (rejected Firebase/SMS/WhatsApp-API once real tradeoffs were explained). Moves fast, expects action over lengthy back-and-forth. Full context in `.claude` memory (`user_role.md`, `project_scope.md`).
