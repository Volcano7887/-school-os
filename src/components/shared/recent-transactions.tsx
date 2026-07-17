import { Wallet, Receipt, Banknote } from "lucide-react";
import type { RecentTransaction } from "@/lib/dashboard/queries";

// Fee is the only "good news" kind here (money in), so it's the only one
// that earns the success tone. Expense and salary are both routine outflows
// — neither is bad news, so neither gets the alarming destructive color;
// the "-" sign already says "money out" without needing red to shout it.
const KIND_CONFIG = {
  fee: {
    icon: Wallet,
    className: "bg-success/10 text-success",
    sign: "+" as const,
  },
  expense: {
    icon: Receipt,
    className: "bg-muted text-muted-foreground",
    sign: "-" as const,
  },
  salary: {
    icon: Banknote,
    className: "bg-muted text-muted-foreground",
    sign: "-" as const,
  },
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

export function RecentTransactions({ transactions }: { transactions: RecentTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No transactions yet.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {transactions.map((t) => {
        const config = KIND_CONFIG[t.kind];
        const Icon = config.icon;
        return (
          <li key={`${t.kind}-${t.id}`} className="flex items-center gap-3 py-2.5">
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${config.className}`}>
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.label}</p>
              <p className="truncate text-xs text-muted-foreground">{t.subLabel}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-medium tabular-nums">
                {config.sign}₹{(t.amount / 100).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">{formatDateTime(t.date)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
