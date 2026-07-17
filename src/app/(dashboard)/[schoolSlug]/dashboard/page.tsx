import Link from "next/link";
import { TrendingUp, TrendingDown, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile, getUserRole } from "@/lib/school/queries";
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
import { CashHandoverCard } from "@/components/shared/cash-handover-card";
import { getCashHandoverHistory } from "@/lib/cash-handovers/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/utils";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [school, academicYear, profileRow] = await Promise.all([
    getSchoolProfile(supabase, schoolId),
    getCurrentAcademicYear(supabase, schoolId),
    user
      ? supabase.from("profiles").select("full_name").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);
  const firstName = profileRow.data?.full_name?.split(" ")[0];

  const [
    stats,
    chartData,
    recentTransactions,
    trend,
    staff,
    balances,
    cashEntries,
    expenseByCategory,
    userRole,
    handoverHistory,
  ] = await Promise.all([
    getDashboardStats(supabase, schoolId),
    getMonthlyIncomeExpense(supabase, schoolId),
    getRecentTransactions(supabase, schoolId),
    getDailyTrend(supabase, schoolId),
    getStaffWithCurrentMonthStatus(supabase, schoolId),
    academicYear ? getStudentBalances(supabase, schoolId, academicYear.id, {}) : Promise.resolve([]),
    getCashBookEntries(supabase, schoolId, "1000"),
    getExpenseByCategoryThisMonth(supabase, schoolId),
    user ? getUserRole(supabase, user.id, schoolId) : Promise.resolve(null),
    getCashHandoverHistory(supabase, schoolId),
  ]);

  const canReceiveCashHandover = userRole === "school_admin" || userRole === "principal";

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

  const cashWithAccountant = cashEntries.at(-1)?.runningBalance ?? 0;

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
          <h1 className="text-2xl font-bold">Good morning{firstName ? `, ${firstName}` : ""}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {school?.name ?? "Your school"} · {formattedDate}
          </p>
        </div>
        <QuickActionMenu schoolSlug={schoolSlug} />
      </div>

      {/* Status banner is intentionally only as wide as the main column
          below (2/3), not the full page — it shouldn't run under where
          AI Insight sits. Rendered as its own single-cell grid row so its
          width matches that column exactly. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-2.5 text-sm lg:col-span-2">
          <span className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="size-4" />
            Everything looks good today.
          </span>
          {alerts.length > 0 && (
            <span className="flex items-center gap-1.5 text-warning">
              <Clock className="size-4" />
              {alerts.length} {alerts.length === 1 ? "item requires" : "items require"} your
              attention.
            </span>
          )}
        </div>
      </div>

      {/* Row: KPI cards + AI Insight. Driven by @container, not viewport —
          a viewport breakpoint can't know the sidebar is currently taking
          240px vs 64px, so it either falls back to desktop-width math (4
          cards + a 320px AI panel) even when a labeled sidebar has only
          left ~115px per card, clipping values like "-₹1,20,359". The
          @[1040px] threshold is the measured point where all 4 cards get
          enough width (~156px+) regardless of what the sidebar is doing. */}
      <div className="@container">
        <div className="flex flex-col gap-6 @[1040px]:flex-row">
          <div className="grid flex-1 grid-cols-2 gap-6 @[1040px]:grid-cols-4">
            <StatCard
              label="Today's Collection"
              value={inr(stats.todayCollection)}
              icon={Wallet}
              trend={trend.collection}
              deltaPercent={deltaPercent(stats.todayCollection, trend.yesterdayCollection)}
            />
            <StatCard
              label="Today's Expenses"
              value={inr(stats.todayExpenses)}
              icon={TrendingDown}
              trend={trend.expenses}
              deltaPercent={deltaPercent(stats.todayExpenses, trend.yesterdayExpenses)}
              goodDirection="down"
            />
            <StatCard
              label="Cash in Hand"
              value={inr(stats.cashInHand)}
              icon={TrendingUp}
            />
            <StatCard
              label="Pending Fees"
              value={inr(stats.pendingFees)}
              icon={Clock}
            />
          </div>
          <div className="@[1040px]:w-80 @[1040px]:shrink-0">
            <AiInsightCard />
          </div>
        </div>
      </div>

      {/* Primary at-a-glance zone — mirrors the approved mockup's pairing:
          a wide "needs attention" queue next to a narrower "what just
          happened" feed. Action Center and Recent Activity already are
          those two things; they just used to live apart (one in the right
          rail, one paired with the expense donut) instead of next to each
          other, immediately below the headline numbers. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActionCenter schoolSlug={schoolSlug} alerts={alerts} />
        </div>
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
      </div>

      {/* Everything past this line is real, working functionality that
          doesn't have a slot in the mockup (it predates it) — kept in
          full, just demoted below the primary glance zone rather than
          competing with it for the first five seconds on the page. */}
      <div className="flex items-center gap-2 pt-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          More detail
        </p>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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

        <div className="space-y-6">
          <MonthlyCollectionPanel
            schoolSlug={schoolSlug}
            months={chartData}
            monthlyFeeTarget={school?.monthlyFeeTarget ?? null}
          />
        </div>
      </div>

      <CashHandoverCard
        schoolSlug={schoolSlug}
        balance={cashWithAccountant}
        canReceive={canReceiveCashHandover}
        history={handoverHistory}
      />
    </div>
  );
}
