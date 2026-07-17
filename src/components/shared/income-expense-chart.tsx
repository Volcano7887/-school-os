"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyIncomeExpense } from "@/lib/dashboard/queries";

const INCOME_COLOR = "#2f6e64";
const EXPENSE_COLOR = "#a3402b";

function formatCompactInr(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(0)}k`;
  return `₹${rupees}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCompactInr(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function IncomeExpenseChart({ data }: { data: MonthlyIncomeExpense[] }) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No transactions yet — this fills in as fees and expenses are recorded.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            className="text-xs fill-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={formatCompactInr}
            className="text-xs fill-muted-foreground"
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => <span className="text-foreground">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="income"
            name="Income"
            stroke={INCOME_COLOR}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke={EXPENSE_COLOR}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
