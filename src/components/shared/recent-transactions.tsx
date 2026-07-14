import { Wallet, Receipt, Banknote } from "lucide-react";
import type { RecentTransaction } from "@/lib/dashboard/queries";

const KIND_CONFIG = {
  fee: {
    icon: Wallet,
    className: "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
    sign: "+" as const,
  },
  expense: {
    icon: Receipt,
    className: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    sign: "-" as const,
  },
  salary: {
    icon: Banknote,
    className: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
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
              <p className="text-sm font-medium">
                {config.sign}₹{(t.amount / 100).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(t.date)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
