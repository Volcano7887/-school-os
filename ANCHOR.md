---
progress: 80
status: In Progress
next: User needs to test Salary Management live (add staff, pay salary, confirm "Pending"->"Paid" status updates, confirm can't double-pay same month). User said Salary Management is the last module to build for now — check in before starting Cash Book/Ledger/Reports/Settings rather than continuing automatically.
goal: Ship Phase 1 of School OS — a multi-tenant school accounting SaaS (fees, expenses, salary, cash book, ledger, reports) for schools across India, starting with Module 1 (Auth + School Management)
---

**Tech stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage). Deployed on Vercel at https://school-os-blue.vercel.app, repo at https://github.com/Volcano7887/-school-os.

**Shipped and confirmed working live (user tested):**
- Module 1: Auth + School Management.
- Student Management.
- **Fee Collection** — confirmed working after fixing two real bugs found during live testing: (1) negative balance displayed as a confusing raw negative number instead of "Advance ₹X" when a student pays before a fee structure exists; (2) academic year / fee structures / payment recording flow all verified end to end.
- **Expense Management** — confirmed working after fixing a real bug: bill photo uploads failed with a generic server error because Next.js caps Server Action bodies at 1MB by default (raised to 10mb in `next.config.ts`) — any real phone-camera photo exceeded that.
- **Real test data imported from the user's actual Boys school Excel** (not fabricated): 72 real students across 8 classes with real names, Monthly Tuition fee structures matching her real per-class amounts (₹3600 for 1st–6th, ₹4200 for 8th/10th, pulled directly from her TOTAL FEES column), and 13 real historical payment transactions (admission + arrears) reconstructed as proper journal entries — ledger verified balanced (debits = credits = ₹10,800). 37 other transactions from her Excel couldn't be matched to a current student (they reference KG-school students or 7th/9th grade with zero current enrollment — a real inconsistency in her own source data, not an import bug).
- **Salary Management — just shipped, NOT yet tested live.** Staff with a monthly salary; salary payments logged per calendar month with a DB-level unique constraint (staff_id, pay_month) preventing double-payment; `record_salary_payment()` posts the matching journal entry atomically (debit Salary Expense account code 6000, credit Cash/Bank) — same pattern as Fee Collection and Expense Management.

**Accounting core** (chart of accounts + double-entry journal_entries/journal_entry_lines) now backs all three transactional modules via atomic Postgres functions: `record_fee_payment()`, `record_expense()`, `record_salary_payment()`. Default accounts per school: 1000 Cash, 1010 Bank, 4000-4030 fee income types, 5000+ user-created expense categories, 6000 Salary Expense.

**Known simplifications (deliberate, not oversights):**
- Classes aren't tied to academic years (persistent grade levels — matches her real workflow).
- Fee "Total Due" is a flat annual sum, not month-elapsed proration.
- No printable/PDF receipt yet — toast confirmation + Payment History table.
- No academic-year switcher UI yet — only ever shows the current year.
- Cash Book, Ledger, Reports (pure reporting views over `journal_entries`) not built yet — the underlying data is real and correct, ready for those screens whenever built.

**Process lesson learned this session**: always run a real `npm run build` (not just `tsc --noEmit` + `eslint`) before pushing — a genuine Vercel 404 turned out to be a stale/failed deploy, not a code bug, but the only way to be confident beforehand is the full production build. Now doing this before every push.

**Still open:**
1. User needs to test Salary Management live.
2. `database.types.ts` still hand-written (Docker/Podman not installed, blocks real `supabase gen types`) — now covers 13 tables + 3 RPC functions.
3. `/style-guide` route still public in production — fine for now, remove/gate before any real launch.

**Worth remembering:** user is a working school accountant building this as a real product — wants pixel-fidelity to her reference mockups where practical, but accounting correctness (double-entry, atomicity, real data over fabricated) takes priority when they conflict. Moves fast, expects action over lengthy back-and-forth, but engineering discipline (test builds, atomic transactions, honest data) has paid off catching real bugs before they compounded. Full context in `.claude` memory (`user_role.md`, `project_scope.md`).
