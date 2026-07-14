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

export type MonthlyIncomeExpense = {
  month: string; // "Jan 2026"
  income: number;
  expense: number;
};

export async function getMonthlyIncomeExpense(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  monthsBack = 6
): Promise<MonthlyIncomeExpense[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (monthsBack - 1));
  since.setDate(1);
  const sinceIso = since.toISOString().slice(0, 10);

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, entry_date")
    .eq("school_id", schoolId)
    .gte("entry_date", sinceIso);

  if (!entries || entries.length === 0) return buildEmptyMonths(monthsBack);

  const entryIds = entries.map((e) => e.id);
  const dateByEntryId = new Map(entries.map((e) => [e.id, e.entry_date]));

  const { data: lines } = await supabase
    .from("journal_entry_lines")
    .select("journal_entry_id, ledger_account_id, debit_amount, credit_amount")
    .in("journal_entry_id", entryIds);

  const accounts = await supabase
    .from("ledger_accounts")
    .select("id, type")
    .eq("school_id", schoolId);
  const typeByAccountId = new Map((accounts.data ?? []).map((a) => [a.id, a.type]));

  const buckets = new Map<string, { income: number; expense: number }>();
  for (const line of lines ?? []) {
    const date = dateByEntryId.get(line.journal_entry_id);
    if (!date) continue;
    const monthKey = date.slice(0, 7); // "2026-06"
    const type = typeByAccountId.get(line.ledger_account_id);
    const bucket = buckets.get(monthKey) ?? { income: 0, expense: 0 };
    if (type === "income") bucket.income += line.credit_amount - line.debit_amount;
    if (type === "expense") bucket.expense += line.debit_amount - line.credit_amount;
    buckets.set(monthKey, bucket);
  }

  return buildEmptyMonths(monthsBack).map((m) => {
    const bucket = buckets.get(m.key!);
    return { month: m.month, income: bucket?.income ?? 0, expense: bucket?.expense ?? 0 };
  });
}

function buildEmptyMonths(count: number): (MonthlyIncomeExpense & { key?: string })[] {
  const months: (MonthlyIncomeExpense & { key?: string })[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() - (count - 1));

  for (let i = 0; i < count; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const label = cursor.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    months.push({ month: label, income: 0, expense: 0, key });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export type RecentTransaction = {
  id: string;
  kind: "fee" | "expense" | "salary";
  label: string;
  subLabel: string;
  amount: number;
  date: string;
};

export async function getRecentTransactions(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  limit = 6
): Promise<RecentTransaction[]> {
  const [{ data: fees }, { data: expenses }, { data: salaries }] = await Promise.all([
    supabase
      .from("fee_payments")
      .select("id, amount, paid_at, receipt_no, student_id")
      .eq("school_id", schoolId)
      .order("paid_at", { ascending: false })
      .limit(limit),
    supabase
      .from("expenses")
      .select("id, amount, expense_date, expense_category_id")
      .eq("school_id", schoolId)
      .order("expense_date", { ascending: false })
      .limit(limit),
    supabase
      .from("salary_payments")
      .select("id, amount, paid_at, staff_id")
      .eq("school_id", schoolId)
      .order("paid_at", { ascending: false })
      .limit(limit),
  ]);

  const studentIds = [...new Set((fees ?? []).map((f) => f.student_id))];
  const categoryIds = [...new Set((expenses ?? []).map((e) => e.expense_category_id))];
  const staffIds = [...new Set((salaries ?? []).map((s) => s.staff_id))];

  const [{ data: students }, { data: categories }, { data: staffRows }] = await Promise.all([
    studentIds.length
      ? supabase.from("students").select("id, full_name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    categoryIds.length
      ? supabase.from("expense_categories").select("id, name").in("id", categoryIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    staffIds.length
      ? supabase.from("staff").select("id, full_name").in("id", staffIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ]);

  const studentNameById = new Map((students ?? []).map((s) => [s.id, s.full_name]));
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const staffNameById = new Map((staffRows ?? []).map((s) => [s.id, s.full_name]));

  const all: RecentTransaction[] = [
    ...(fees ?? []).map((f) => ({
      id: f.id,
      kind: "fee" as const,
      label: "Fee Collection",
      subLabel: `${studentNameById.get(f.student_id) ?? "Student"} · ${f.receipt_no}`,
      amount: f.amount,
      date: f.paid_at,
    })),
    ...(expenses ?? []).map((e) => ({
      id: e.id,
      kind: "expense" as const,
      label: categoryNameById.get(e.expense_category_id) ?? "Expense",
      subLabel: "Expense",
      amount: e.amount,
      date: e.expense_date,
    })),
    ...(salaries ?? []).map((s) => ({
      id: s.id,
      kind: "salary" as const,
      label: "Salary Payment",
      subLabel: staffNameById.get(s.staff_id) ?? "Staff",
      amount: s.amount,
      date: s.paid_at,
    })),
  ];

  return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export type UpcomingFeeDueItem = {
  studentId: string;
  fullName: string;
  className: string | null;
  balance: number;
};

export async function getUpcomingFeeDue(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  limit = 5
): Promise<UpcomingFeeDueItem[]> {
  const academicYear = await getCurrentAcademicYear(supabase, schoolId);
  if (!academicYear) return [];

  const balances = await getStudentBalances(supabase, schoolId, academicYear.id, {});

  return balances
    .filter((b) => b.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit)
    .map((b) => ({
      studentId: b.studentId,
      fullName: b.fullName,
      className: b.className,
      balance: b.balance,
    }));
}

export type RecentExpenseItem = {
  id: string;
  categoryName: string;
  amount: number;
  expenseDate: string;
};

export async function getRecentExpensesList(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  limit = 5
): Promise<RecentExpenseItem[]> {
  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, amount, expense_date, expense_category_id")
    .eq("school_id", schoolId)
    .order("expense_date", { ascending: false })
    .limit(limit);

  if (!expenses || expenses.length === 0) return [];

  const categoryIds = [...new Set(expenses.map((e) => e.expense_category_id))];
  const { data: categories } = await supabase
    .from("expense_categories")
    .select("id, name")
    .in("id", categoryIds);

  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  return expenses.map((e) => ({
    id: e.id,
    categoryName: categoryNameById.get(e.expense_category_id) ?? "Expense",
    amount: e.amount,
    expenseDate: e.expense_date,
  }));
}
