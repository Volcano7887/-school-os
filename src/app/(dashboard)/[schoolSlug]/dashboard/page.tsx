import Link from "next/link";
import { BadgeCheck, TrendingUp, TrendingDown, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getStudentBalances } from "@/lib/fees/queries";
import { getStaffWithCurrentMonthStatus } from "@/lib/salary/queries";
import { getCashBookEntries } from "@/lib/accounting/queries";
import { getExpenseByCategoryThisMonth } from "@/lib/reports/queries";
import {
  getDashboardStats,
  getMonthlyIncomeExpense,
  getRecentTransactions,
  getDailyTrend,
} from "@/lib/dashboard/queries";
import { StatCard } from "@/components/shared/stat-card";
import { IncomeExpenseChart } from "@/components/shared/income-expense-chart";
import { RecentTransactions } from "@/components/shared/recent-transactions";
import { ExpenseCategoryDonut } from "@/components/shared/expense-category-donut";
import { QuickActionMenu } from "@/components/shared/quick-action-menu";
import { AiInsightCard } from "@/components/shared/ai-insight-card";
import { MonthlyCollectionPanel } from "@/components/shared/monthly-collection-panel";
import { FeeRecoveryGauge } from "@/components/shared/fee-recovery-gauge";
import { ActionCenter, type ActionCenterAlert } from "@/components/shared/action-center";
import { EndOfDayClosing } from "@/components/shared/end-of-day-closing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/utils";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function deltaPercent(today: number, yesterday: number): number | undefined {
  if (today === 0 && yesterday === 0) return undefined;
  if (yesterday === 0) return 100;
  return ((today - yesterday) / yesterday) * 100;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const [school, academicYear] = await Promise.all([
    getSchoolProfile(supabase, schoolId),
    getCurrentAcademicYear(supabase, schoolId),
  ]);

  const [stats, chartData, recentTransactions, trend, staff, balances, cashEntries, expenseByCategory] =
    await Promise.all([
      getDashboardStats(supabase, schoolId),
      getMonthlyIncomeExpense(supabase, schoolId),
      getRecentTransactions(supabase, schoolId),
      getDailyTrend(supabase, schoolId),
      getStaffWithCurrentMonthStatus(supabase, schoolId),
      academicYear ? getStudentBalances(supabase, schoolId, academicYear.id, {}) : Promise.resolve([]),
      getCashBookEntries(supabase, schoolId, "1000"),
      getExpenseByCategoryThisMonth(supabase, schoolId),
    ]);

  const collected = balances.reduce((sum, b) => sum + b.totalPaid, 0);
  const totalDue = balances.reduce((sum, b) => sum + Math.max(b.balance, 0), 0);
  const studentsPending = balances.filter((b) => b.balance > 0).length;
  const unpaidStaff = staff.filter((s) => !s.paidThisMonth);

  const alerts: ActionCenterAlert[] = [];
  if (unpaidStaff.length > 0) {
    alerts.push({
      id: "salary-pending",
      label: `Salary pending for ${unpaidStaff.length} ${unpaidStaff.length === 1 ? "teacher" : "teachers"}`,
      meta: inr(unpaidStaff.reduce((sum, s) => sum + s.monthlySalary, 0)),
      href: `/${schoolSlug}/salary`,
      priority: "high",
    });
  }
  if (studentsPending > 0) {
    alerts.push({
      id: "fees-overdue",
      label: `${studentsPending} ${studentsPending === 1 ? "student has" : "students have"} overdue fees`,
      meta: inr(totalDue),
      href: `/${schoolSlug}/fees`,
      priority: "attention",
    });
  }

  const today = todayIso();
  const todayCashEntries = cashEntries.filter((e) => e.date === today);
  const todayIncome = todayCashEntries.reduce((sum, e) => sum + e.debit, 0);
  const todayExpense = todayCashEntries.reduce((sum, e) => sum + e.credit, 0);
  const closingCash = cashEntries.at(-1)?.runningBalance ?? 0;
  const openingCash = closingCash - todayIncome + todayExpense;

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{school?.name ?? "Your school"}</h1>
            <BadgeCheck className="size-6 text-primary" />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">Finance Command Center</p>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {formattedDate}
            </span>
          </div>
        </div>
        <QuickActionMenu schoolSlug={schoolSlug} />
      </div>

      {/* Main column (left, 2/3) + right rail — a persistent two-column
          split, not row-by-row grids, so the rail runs alongside the main
          column instead of interleaving with it. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="@container space-y-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-2.5 text-sm">
            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-4" />
              Everything looks good today.
            </span>
            {alerts.length > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Clock className="size-4" />
                {alerts.length} {alerts.length === 1 ? "item requires" : "items require"} your
                attention.
              </span>
            )}
          </div>

          {/* Container queries, not viewport breakpoints — this column's
              actual width depends on whether the right rail is present,
              not just the screen size, so lg:/xl: alone can't tell it
              apart from a full-width layout. */}
          <div className="grid gap-6 @sm:grid-cols-2 @2xl:grid-cols-4">
            <StatCard
              label="Today's Collection"
              value={inr(stats.todayCollection)}
              icon={Wallet}
              color="purple"
              trend={trend.collection}
              deltaPercent={deltaPercent(stats.todayCollection, trend.yesterdayCollection)}
            />
            <StatCard
              label="Today's Expenses"
              value={inr(stats.todayExpenses)}
              icon={TrendingDown}
              color="green"
              trend={trend.expenses}
              deltaPercent={deltaPercent(stats.todayExpenses, trend.yesterdayExpenses)}
              goodDirection="down"
            />
            <StatCard
              label="Cash in Hand"
              value={inr(stats.cashInHand)}
              icon={TrendingUp}
              color="orange"
            />
            <StatCard
              label="Pending Fees"
              value={inr(stats.pendingFees)}
              icon={Clock}
              color="red"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>6 Month Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <IncomeExpenseChart data={chartData} />
            </CardContent>
          </Card>

          <FeeRecoveryGauge
            schoolSlug={schoolSlug}
            collected={collected}
            totalDue={totalDue}
            studentsPending={studentsPending}
          />

          <div className="grid gap-6 @2xl:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${schoolSlug}/audit-log`}>View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <RecentTransactions transactions={recentTransactions} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Expense Categories</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${schoolSlug}/reports`}>View full report</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <ExpenseCategoryDonut data={expenseByCategory} />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <AiInsightCard />
          <MonthlyCollectionPanel
            schoolSlug={schoolSlug}
            months={chartData}
            monthlyFeeTarget={school?.monthlyFeeTarget ?? null}
          />
          <ActionCenter schoolSlug={schoolSlug} alerts={alerts} />
        </div>
      </div>

      <EndOfDayClosing
        opening={openingCash}
        income={todayIncome}
        expense={todayExpense}
        closing={closingCash}
      />
    </div>
  );
}
