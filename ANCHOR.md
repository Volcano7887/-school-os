---
progress: 95
status: In Progress
next: User needs to live-test this session's UI work — Dashboard chart/recent activity, bill image preview, and especially the redesigned Fee Collection dialog (verify Save & Print Receipt actually navigates to the receipt, and the live Summary numbers update correctly as amount is typed). Also still pending from before: Bills, Audit Log, Settings live testing.
goal: Ship Phase 1 of School OS — a multi-tenant school accounting SaaS (fees, expenses, salary, cash book, ledger, reports) for schools across India, starting with Module 1 (Auth + School Management)
---

**Tech stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage). Deployed on Vercel at https://school-os-blue.vercel.app, repo at https://github.com/Volcano7887/-school-os.

**Every module from the original Phase 1 list has a real, working page.** `npm run build` runs before every push now (a real Vercel 404 earlier turned out to be exactly the kind of thing `tsc`+`eslint` alone miss).

**Confirmed working live (user tested):** Auth, School Management, Student Management, Fee Collection, Expense Management, Salary Management, Cash Book, Ledger.

**Shipped, NOT yet tested live:** Dashboard, Reports, Bills, Audit Log, Settings — plus everything from this session's UI pass (see below).

**This session — UI polish pass against the user's reference mockups** (prioritized: dashboard → bill preview → Fee Collection redesign, per user's explicit ordering):
1. **Dashboard**: added a Cash Flow line chart (recharts, 6 months, income green solid / expense red dashed) and a Recent Transactions feed merging fee payments + expenses + salary payments. Chart colors run through the dataviz skill's CVD validator (ΔE 20.6 deuteranopia, passes with margin) plus a secondary encoding (dashed vs solid) so identity never depends on color alone.
2. **Add Expense**: bill upload now shows an actual image thumbnail (object URL, revoked on change/unmount) instead of just a filename — PDFs still show a filename+icon since browsers can't thumbnail those without a library.
3. **Fee Collection dialog redesigned** to match the reference's split-panel layout: left = student avatar/class/Total Due + "View History" link; right = Collection Details form + a Summary panel that live-recalculates (Previous Paid, Total Due, Amount Received, Balance/Advance) as the amount is typed, before saving. Added a real "Save & Print Receipt" button (saves, then jumps straight to the printable receipt) distinct from "Save Collection" (saves, toast + View Receipt action).

**Also shipped this session**: printable fee receipts (browser print/PDF), WhatsApp click-to-send for receipts and fee reminders (English/Hindi/Hinglish) — zero-cost, zero-API, one-tap-to-send links, chosen deliberately over SMS (DLT registration required in India) and WhatsApp Business API (Meta verification takes days) since the user wanted something working today at zero cost.

**Accounting core**: chart of accounts + double-entry journal; `record_fee_payment`, `record_expense`, `record_salary_payment` all post atomically via SECURITY DEFINER Postgres functions and write an audit log row in the same transaction.

**Real test data**: 72 real students imported from the user's actual Boys school Excel, real per-class tuition amounts, 13 real historical transactions reconstructed as balanced journal entries.

**Known simplifications (deliberate):**
- No academic-year switcher UI — only ever shows the current year.
- `/style-guide` route still public — remove/gate before real launch.
- `database.types.ts` still hand-written (Docker/Podman not installed) — now covers 15 tables + 3 RPC functions; worth revisiting Docker install soon, it's getting large.
- Parent notifications are manual-send (click-to-send WhatsApp links), not automatic — a deliberate cost/complexity tradeoff, not an oversight.

**Worth remembering:** user is a working school accountant building this as a real product — wants pixel-fidelity to her reference mockups where practical, but accounting correctness takes priority when they conflict, and is explicit about wanting zero-cost solutions (rejected Firebase/SMS/WhatsApp-API for parent messaging once the real cost/setup tradeoffs were explained; chose the manual WhatsApp-link approach instead). Moves fast, expects action over lengthy back-and-forth. Full context in `.claude` memory (`user_role.md`, `project_scope.md`).
