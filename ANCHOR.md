---
progress: 85
status: In Progress
next: User needs to test Cash Book + Ledger live (check Cash/Bank tabs show correct running balances matching what's been recorded so far; pick a few accounts in Ledger and confirm the numbers make sense). After that, remaining Phase 1 modules: Reports, Bill Upload (partially done via Expense bill uploads — may just need a dedicated Bills list view), Audit Log, Settings.
goal: Ship Phase 1 of School OS — a multi-tenant school accounting SaaS (fees, expenses, salary, cash book, ledger, reports) for schools across India, starting with Module 1 (Auth + School Management)
---

**Tech stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage). Deployed on Vercel at https://school-os-blue.vercel.app, repo at https://github.com/Volcano7887/-school-os.

**Shipped and confirmed working live (user tested):**
- Module 1: Auth + School Management.
- Student Management.
- Fee Collection — confirmed working after fixing two real bugs found during live testing (negative-balance display, and general flow verification).
- Expense Management — confirmed working after fixing a real bug (Server Action 1MB body limit blocked bill photo uploads; raised to 10mb).
- Salary Management — confirmed working (staff add, pay salary, Pending→Paid status, double-payment prevented at DB level).
- **Real test data imported from the user's actual Boys school Excel** (not fabricated): 72 real students across 8 classes, real Monthly Tuition amounts per class (₹3600 for 1st–6th, ₹4200 for 8th/10th), 13 real historical payment transactions reconstructed as balanced journal entries (debits = credits = ₹10,800 verified).

**Shipped, NOT yet tested live:**
- **Cash Book** — day-wise Cash in Hand / Bank Account register, tabbed, with running balance.
- **Ledger** — account-wise transaction history for any account in the chart of accounts, running balance respects each account's normal side (debit-normal for asset/expense, credit-normal for liability/income/equity).

Both are pure reporting views over `journal_entries`/`journal_entry_lines` — no new write paths, so risk is low, but not yet visually confirmed correct by the user.

**Accounting core** (chart of accounts + double-entry journal) backs all three transactional modules via atomic Postgres functions: `record_fee_payment()`, `record_expense()`, `record_salary_payment()`. Default accounts per school: 1000 Cash, 1010 Bank, 4000-4030 fee income types, 5000+ user-created expense categories, 6000 Salary Expense.

**Known simplifications (deliberate, not oversights):**
- Classes aren't tied to academic years (persistent grade levels — matches her real workflow).
- Fee "Total Due" is a flat annual sum, not month-elapsed proration.
- No printable/PDF receipt yet — toast confirmation + Payment History table.
- No academic-year switcher UI yet — only ever shows the current year (Cash Book/Ledger currently show ALL-time transactions, not scoped by year, since there's only one year of data — will need reconsidering once multi-year data exists).
- Reports (trial balance, income/expense summary, defaulter list) not built yet.

**Process lesson learned this session**: always run a real `npm run build` (not just `tsc --noEmit` + `eslint`) before pushing — a genuine Vercel 404 turned out to be a stale/failed deploy, not a code bug. Now doing this before every push, no exceptions.

**Still open:**
1. User needs to test Cash Book + Ledger live.
2. `database.types.ts` still hand-written (Docker/Podman not installed, blocks real `supabase gen types`) — now covers 13 tables + 3 RPC functions.
3. `/style-guide` route still public in production — fine for now, remove/gate before any real launch.

**Worth remembering:** user is a working school accountant building this as a real product — wants pixel-fidelity to her reference mockups where practical, but accounting correctness (double-entry, atomicity, real data over fabricated) takes priority when they conflict. Moves fast, expects action over lengthy back-and-forth, but engineering discipline (test builds, atomic transactions, honest data) has paid off catching real bugs before they compounded. Full context in `.claude` memory (`user_role.md`, `project_scope.md`).
