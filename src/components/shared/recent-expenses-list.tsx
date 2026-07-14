import type { RecentExpenseItem } from "@/lib/dashboard/queries";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function RecentExpensesList({ items }: { items: RecentExpenseItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No expenses recorded yet.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.categoryName}</p>
            <p className="text-xs text-muted-foreground">{formatDate(item.expenseDate)}</p>
          </div>
          <p className="text-sm font-medium text-destructive">
            ₹{(item.amount / 100).toLocaleString("en-IN")}
          </p>
        </li>
      ))}
    </ul>
  );
}
