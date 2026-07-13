---
progress: 74
status: In Progress
next: User needs to test Fee Collection AND Expense Management live end-to-end. Fee Collection previously 404'd on Vercel despite building cleanly locally — triggered a fresh empty-commit deploy to rule out a stale/failed build; not yet confirmed fixed. IMPORTANT — never send login credentials in chat, even offered: user pasted their real password once (2026-07-15ish); it was refused and they were told to reset it. Confirm they actually rotated it next time this comes up.
goal: Ship Phase 1 of School OS — a multi-tenant school accounting SaaS (fees, expenses, salary, cash book, ledger, reports) for schools across India, starting with Module 1 (Auth + School Management)
---

**Tech stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage). Deployed on Vercel at https://school-os-blue.vercel.app, repo at https://github.com/Volcano7887/-school-os.

**Shipped and live:**
- Module 1: Auth + School Management — done, verified live.
- Student Management — done, verified live by user (classes, students, search/filter, profile, edit).
- **Fee Collection — just shipped, NOT yet tested live.** Includes:
  - **Accounting core**: chart of accounts (`ledger_accounts`, 6 default accounts seeded per school — Cash, Bank, and 4 income accounts) + `journal_entries`/`journal_entry_lines` (double-entry). Every fee payment posts a real journal entry.
  - **Atomicity via Postgres function**: `record_fee_payment()` (SECURITY DEFINER) creates the payment + its journal entry in one transaction — client-side multi-step inserts would risk a payment existing with no matching journal entry if a step failed mid-way.
  - **Academic year setup**: shown automatically when a school has none; defaults to June–May per the user's real records, editable.
  - **Fee structures**: Tuition / Admission / Exam / Arrears (the 4 real types from her Excel data), each with an annual amount, optionally scoped to a class.
  - **Fee Collection screen**: student list with computed Total Due / Paid / Balance (simple annual sum minus payments — matches her Excel's TOTAL FEES/PAID/BALANCE columns, not a month-by-month proration engine she doesn't use) + status badge, "Record payment" dialog (fee type, amount, payment mode, date, period label, remarks), auto-generated receipt number (`RCPT-00001` style), toast confirmation.
  - Student profile page now shows real Payment History instead of a placeholder.

**Known simplifications (deliberate, not oversights):**
- Classes are not tied to academic years (persistent grade levels — matches her real workflow).
- "Total Due" is a flat annual sum per applicable fee structure, not a month-elapsed proration.
- No printable/PDF receipt yet — just a toast with the receipt number. Payment History table shows all the same data.
- Cash Book and Ledger (reporting views over journal_entries) aren't built yet — the data feeding them is now real and correct, but the report screens are a later module.

**Still open:**
1. **User needs to test Fee Collection live** — I can't verify authenticated flows myself (don't handle credentials). Test: create academic year → add fee structures for a class → record a payment → confirm balance updates → check student profile's Payment History.
2. `database.types.ts` still hand-written (Docker/Podman not installed, blocks real `supabase gen types`) — now covers 10 tables + 1 RPC function, getting more error-prone to hand-maintain as it grows. Worth revisiting Docker install at some point.

**Expense Management module shipped** (categories with auto-created ledger accounts, vendors, expense entry with real bill/invoice upload to a private Supabase Storage bucket, RLS-scoped per school via folder path). `record_expense()` mirrors `record_fee_payment()` — same atomic posting pattern. Not yet tested live by the user.

**Next module: Salary Management**, then **Cash Book** and **Ledger** (pure reporting views over `journal_entries` — should be fast since the underlying data is already correct from Fee Collection + Expense Management).

**Worth remembering:** user is a working school accountant building this as a real product, not a toy — wants pixel-fidelity to her reference mockups where practical, but accounting correctness (double-entry, atomicity) takes priority over exact mockup replication when they conflict. Moves fast, expects action over lengthy back-and-forth. Full context in `.claude` memory (`user_role.md`, `project_scope.md`).
