import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getStudentBalances } from "@/lib/fees/queries";
import { getStaffWithCurrentMonthStatus } from "@/lib/salary/queries";
import { getCashBookEntries } from "@/lib/accounting/queries";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export type DashboardStats = {
  todayCollection: number;
  todayExpenses: number;
  cashInHand: number;
  pendingFees: number;
  pendingSalaries: number;
};

export async function getDashboardStats(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<DashboardStats> {
  const today = todayIso();

  const [
    { data: todayPayments },
    { data: todayExpenseRows },
    cashEntries,
    bankEntries,
    academicYear,
    staff,
  ] = await Promise.all([
    supabase.from("fee_payments").select("amount").eq("school_id", schoolId).eq("paid_at", today),
    supabase.from("expenses").select("amount").eq("school_id", schoolId).eq("expense_date", today),
    getCashBookEntries(supabase, schoolId, "1000"),
    getCashBookEntries(supabase, schoolId, "1010"),
    getCurrentAcademicYear(supabase, schoolId),
    getStaffWithCurrentMonthStatus(supabase, schoolId),
  ]);

  const todayCollection = (todayPayments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const todayExpenses = (todayExpenseRows ?? []).reduce((sum, e) => sum + e.amount, 0);
  const cashInHand =
    (cashEntries.at(-1)?.runningBalance ?? 0) + (bankEntries.at(-1)?.runningBalance ?? 0);

  const balances = academicYear
    ? await getStudentBalances(supabase, schoolId, academicYear.id, {})
    : [];
  const pendingFees = balances.reduce((sum, s) => sum + Math.max(s.balance, 0), 0);

  const pendingSalaries = staff
    .filter((s) => !s.paidThisMonth)
    .reduce((sum, s) => sum + s.monthlySalary, 0);

  return { todayCollection, todayExpenses, cashInHand, pendingFees, pendingSalaries };
}
