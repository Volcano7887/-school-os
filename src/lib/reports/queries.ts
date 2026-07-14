import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    daysInMonth: end.getDate(),
  };
}

export type DailyIncomeExpense = {
  day: string; // "1 May"
  income: number;
  expense: number;
};

export async function getDailyIncomeExpenseThisMonth(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<DailyIncomeExpense[]> {
  const { start, end, daysInMonth } = currentMonthRange();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, entry_date")
    .eq("school_id", schoolId)
    .gte("entry_date", start)
    .lte("entry_date", end);

  const dayBuckets = new Map<number, { income: number; expense: number }>();
  for (let d = 1; d <= daysInMonth; d++) dayBuckets.set(d, { income: 0, expense: 0 });

  if (entries && entries.length > 0) {
    const entryIds = entries.map((e) => e.id);
    const dayByEntryId = new Map(
      entries.map((e) => [e.id, new Date(e.entry_date).getDate()])
    );

    const { data: lines } = await supabase
      .from("journal_entry_lines")
      .select("journal_entry_id, ledger_account_id, debit_amount, credit_amount")
      .in("journal_entry_id", entryIds);

    const { data: accounts } = await supabase
      .from("ledger_accounts")
      .select("id, type")
      .eq("school_id", schoolId);
    const typeByAccountId = new Map((accounts ?? []).map((a) => [a.id, a.type]));

    for (const line of lines ?? []) {
      const day = dayByEntryId.get(line.journal_entry_id);
      if (!day) continue;
      const type = typeByAccountId.get(line.ledger_account_id);
      const bucket = dayBuckets.get(day)!;
      if (type === "income") bucket.income += line.credit_amount - line.debit_amount;
      if (type === "expense") bucket.expense += line.debit_amount - line.credit_amount;
    }
  }

  const monthLabel = new Date(start).toLocaleDateString("en-IN", { month: "short" });
  return Array.from(dayBuckets.entries()).map(([day, v]) => ({
    day: `${day} ${monthLabel}`,
    income: v.income,
    expense: v.expense,
  }));
}

export type ExpenseCategoryBreakdown = {
  category: string;
  amount: number;
};

export async function getExpenseByCategoryThisMonth(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<ExpenseCategoryBreakdown[]> {
  const { start, end } = currentMonthRange();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount, expense_category_id")
    .eq("school_id", schoolId)
    .gte("expense_date", start)
    .lte("expense_date", end);

  if (!expenses || expenses.length === 0) return [];

  const { data: categories } = await supabase
    .from("expense_categories")
    .select("id, name")
    .eq("school_id", schoolId);
  const nameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const totals = new Map<string, number>();
  for (const e of expenses) {
    const name = nameById.get(e.expense_category_id) ?? "Other";
    totals.set(name, (totals.get(name) ?? 0) + e.amount);
  }

  return Array.from(totals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
