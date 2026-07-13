import { TrendingUp, TrendingDown, Wallet, Clock, Users } from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { StatCard } from "@/components/shared/stat-card";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview — Student Management and Fee Collection land next.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Today's Collection"
          value="₹0"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Today's Expenses"
          value="₹0"
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          label="Cash in Hand"
          value="₹0"
          icon={Wallet}
          color="blue"
        />
        <StatCard
          label="Pending Fees"
          value="₹0"
          icon={Clock}
          color="orange"
        />
        <StatCard
          label="Pending Salaries"
          value="₹0"
          icon={Users}
          color="purple"
        />
      </div>
    </div>
  );
}
