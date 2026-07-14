import { TrendingUp, TrendingDown, Wallet, Clock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getDashboardStats } from "@/lib/dashboard/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { StatCard } from "@/components/shared/stat-card";

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

  const stats = await getDashboardStats(supabase, schoolId);

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
    </div>
  );
}
