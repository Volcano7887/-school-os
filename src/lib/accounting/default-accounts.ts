import type { AccountType } from "@/types/database.types";

// Must match the backfills in
// supabase/migrations/20260716000001_accounting_core_and_fees.sql and
// supabase/migrations/20260718000001_salary_management.sql
export const DEFAULT_LEDGER_ACCOUNTS: {
  code: string;
  name: string;
  type: AccountType;
}[] = [
  { code: "1000", name: "Cash in Hand", type: "asset" },
  { code: "1010", name: "Bank Account", type: "asset" },
  { code: "4000", name: "Tuition Fee Income", type: "income" },
  { code: "4010", name: "Admission Fee Income", type: "income" },
  { code: "4020", name: "Exam Fee Income", type: "income" },
  { code: "4030", name: "Arrears Income", type: "income" },
  // 5000+ is reserved for user-created expense categories.
  { code: "6000", name: "Salary Expense", type: "expense" },
];
