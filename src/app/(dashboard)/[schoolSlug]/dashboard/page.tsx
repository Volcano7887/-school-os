import Link from "next/link";
import { TrendingUp, TrendingDown, Wallet, Clock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import {
  getDashboardStats,
  getMonthlyIncomeExpense,
  getRecentTransactions,
  getUpcomingFeeDue,
  getRecentExpensesList,
} from "@/lib/dashboard/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { StatCard } from "@/components/shared/stat-card";
import { IncomeExpenseChart } from "@/components/shared/income-expense-chart";
import { RecentTransactions } from "@/components/shared/recent-transactions";
import { UpcomingFeeDue } from "@/components/shared/upcoming-fee-due";
import { RecentExpensesList } from "@/components/shared/recent-expenses-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
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

  const [stats, chartData, recentTransactions, upcomingFeeDue, recentExpenses] =
    await Promise.all([
      getDashboardStats(supabase, schoolId),
      getMonthlyIncomeExpense(supabase, schoolId),
      getRecentTransactions(supabase, schoolId),
      getUpcomingFeeDue(supabase, schoolId),
      getRecentExpensesList(supabase, schoolId),
    ]);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Today's Collection"
          value={inr(stats.todayCollection)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Today's Expenses"
          value={inr(stats.todayExpenses)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          label="Cash in Hand"
          value={inr(stats.cashInHand)}
          icon={Wallet}
          color="blue"
        />
        <StatCard
          label="Pending Fees"
          value={inr(stats.pendingFees)}
          icon={Clock}
          color="orange"
        />
        <StatCard
          label="Pending Salaries"
          value={inr(stats.pendingSalaries)}
          icon={Users}
          color="purple"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow (Last 6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={recentTransactions} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Fee Due</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${schoolSlug}/fees`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <UpcomingFeeDue schoolSlug={schoolSlug} items={upcomingFeeDue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Expenses</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${schoolSlug}/expenses`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentExpensesList items={recentExpenses} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
