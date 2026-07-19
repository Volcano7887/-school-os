import Link from "next/link";
import { CalendarDays, CalendarRange, TrendingUp, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getTrialBalance } from "@/lib/accounting/queries";
import {
  getDailyIncomeExpenseThisMonth,
  getExpenseByCategoryThisMonth,
} from "@/lib/reports/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyIncomeExpenseBar } from "@/components/shared/daily-income-expense-bar";
import { ExpenseCategoryDonut } from "@/components/shared/expense-category-donut";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

const TYPE_LABEL: Record<string, string> = {
  asset: "Asset",
  liability: "Liability",
  income: "Income",
  expense: "Expense",
  equity: "Equity",
};

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const [trialBalance, dailyData, expenseByCategory] = await Promise.all([
    getTrialBalance(supabase, schoolId),
    getDailyIncomeExpenseThisMonth(supabase, schoolId),
    getExpenseByCategoryThisMonth(supabase, schoolId),
  ]);

  const totalIncome = trialBalance
    .filter((a) => a.type === "income")
    .reduce((sum, a) => sum + a.balance, 0);
  const totalExpense = trialBalance
    .filter((a) => a.type === "expense")
    .reduce((sum, a) => sum + a.balance, 0);
  const net = totalIncome - totalExpense;

  const totalDebits = trialBalance.reduce((sum, a) => sum + a.debitTotal, 0);
  const totalCredits = trialBalance.reduce((sum, a) => sum + a.creditTotal, 0);

  const monthIncome = dailyData.reduce((sum, d) => sum + d.income, 0);
  const monthExpense = dailyData.reduce((sum, d) => sum + d.expense, 0);
  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const trialBalanceCsv = [
    ["Account", "Type", "Debit", "Credit", "Balance"],
    ...trialBalance.map((a) => [
      `${a.code} — ${a.name}`,
      TYPE_LABEL[a.type],
      (a.debitTotal / 100).toFixed(2),
      (a.creditTotal / 100).toFixed(2),
      (a.balance / 100).toFixed(2),
    ]),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Reports</h1>

      {/* Quick shortcuts — real navigation to the relevant section/page below,
          not separate fabricated report engines. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <a
          href="#this-month"
          className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center text-sm hover:bg-muted"
        >
          <CalendarDays className="size-5 text-muted-foreground" />
          Daily Report
        </a>
        <a
          href="#this-month"
          className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center text-sm hover:bg-muted"
        >
          <CalendarRange className="size-5 text-muted-foreground" />
          Monthly Report
        </a>
        <a
          href="#all-time"
          className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center text-sm hover:bg-muted"
        >
          <TrendingUp className="size-5 text-muted-foreground" />
          Income vs Expense
        </a>
        <Link
          href={`/${schoolSlug}/fees`}
          className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center text-sm hover:bg-muted"
        >
          <Wallet className="size-5 text-muted-foreground" />
          Fee Collection Report
        </Link>
      </div>

      <section id="this-month" className="scroll-mt-4 space-y-3">
        <h2 className="text-lg font-semibold">Income vs Expense ({monthLabel})</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex gap-6 text-sm">
                <span className="text-green-600 dark:text-green-400">
                  Income: {inr(monthIncome)}
                </span>
                <span className="text-red-600 dark:text-red-400">
                  Expense: {inr(monthExpense)}
                </span>
              </div>
              <DailyIncomeExpenseBar data={dailyData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseCategoryDonut data={expenseByCategory} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="all-time" className="scroll-mt-4 space-y-3">
        <h2 className="text-lg font-semibold">Income vs Expense (All-time)</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {inr(totalIncome)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expense
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {inr(totalExpense)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Net</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{inr(net)}</CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trial Balance</h2>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              {totalDebits === totalCredits
                ? "Balanced ✓"
                : "⚠ Debits and credits don't match — this shouldn't happen"}
            </p>
            <ExportCsvButton filename="trial-balance.csv" rows={trialBalanceCsv} />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Debit</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialBalance.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.code} — {a.name}
                  </TableCell>
                  <TableCell>{TYPE_LABEL[a.type]}</TableCell>
                  <TableCell>{a.debitTotal > 0 ? inr(a.debitTotal) : ""}</TableCell>
                  <TableCell>{a.creditTotal > 0 ? inr(a.creditTotal) : ""}</TableCell>
                  <TableCell>{inr(a.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
