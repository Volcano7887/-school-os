"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { ExpenseCategoryBreakdown } from "@/lib/reports/queries";

// Fixed order, validated for CVD safety (see dataviz skill) — never
// reassigned dynamically as categories are filtered in/out.
const CATEGORY_COLORS = [
  "#2563eb",
  "#0d9488",
  "#dc2626",
  "#7c3aed",
  "#b45309",
  "#be185d",
];

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function ExpenseCategoryDonut({ data }: { data: ExpenseCategoryBreakdown[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No expenses this month yet.
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.amount, 0);
  // "Other" bucket for categories beyond the fixed palette, rather than
  // generating a new hue — matches the skill's "never a generated hue" rule.
  const top = data.slice(0, 5);
  const rest = data.slice(5);
  const chartData =
    rest.length > 0
      ? [...top, { category: "Other", amount: rest.reduce((s, d) => s + d.amount, 0) }]
      : top;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              innerRadius={50}
              outerRadius={80}
              strokeWidth={2}
              stroke="var(--background)"
            >
              {chartData.map((entry, i) => (
                <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => inr(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-1.5 text-sm">
        <li className="flex items-center justify-between border-b pb-1.5 font-medium">
          <span>Total</span>
          <span>{inr(total)}</span>
        </li>
        {chartData.map((entry, i) => (
          <li key={entry.category} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
              />
              {entry.category}
            </span>
            <span>{total > 0 ? Math.round((entry.amount / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
