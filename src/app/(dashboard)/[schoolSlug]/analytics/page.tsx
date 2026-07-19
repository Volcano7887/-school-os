import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getMonthlyIncomeExpense } from "@/lib/dashboard/queries";
import { getExpenseByCategoryLast12Months } from "@/lib/reports/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeExpenseChart } from "@/components/shared/income-expense-chart";
import { ExpenseCategoryDonut } from "@/components/shared/expense-category-donut";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const [months, expenseByCategory] = await Promise.all([
    getMonthlyIncomeExpense(supabase, schoolId, 12),
    getExpenseByCategoryLast12Months(supabase, schoolId),
  ]);

  const monthsWithData = months.filter((m) => m.income > 0 || m.expense > 0);
  const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
  const totalExpense = months.reduce((sum, m) => sum + m.expense, 0);
  const avgMonthlyIncome = monthsWithData.length
    ? Math.round(totalIncome / monthsWithData.length)
    : 0;
  const avgMonthlyExpense = monthsWithData.length
    ? Math.round(totalExpense / monthsWithData.length)
    : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Longer-range trends — for month/day snapshots, see Reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Monthly Collection
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {inr(avgMonthlyIncome)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Monthly Expense
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {inr(avgMonthlyExpense)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              12-Month Net
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {inr(totalIncome - totalExpense)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>12-Month Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeExpenseChart data={months} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense Categories (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseCategoryDonut data={expenseByCategory} />
        </CardContent>
      </Card>
    </div>
  );
}
