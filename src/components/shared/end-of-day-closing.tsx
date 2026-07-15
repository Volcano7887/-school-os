import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function EndOfDayClosing({
  opening,
  income,
  expense,
  closing,
}: {
  opening: number;
  income: number;
  expense: number;
  closing: number;
}) {
  const items = [
    { label: "Opening Cash", value: opening },
    { label: "Total Income", value: income, tone: "text-green-600 dark:text-green-400" },
    { label: "Total Expense", value: expense, tone: "text-red-600 dark:text-red-400" },
    { label: "Closing Cash", value: closing, tone: "font-semibold" },
  ];

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">End-of-Day Closing</p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              Upcoming Feature
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Close today&apos;s accounts, verify cash, and generate a closing report.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-sm ${item.tone ?? ""}`}>{inr(item.value)}</p>
            </div>
          ))}
        </div>

        <Button disabled title="Coming soon">
          <Lock className="size-4" />
          Close Today&apos;s Accounts
        </Button>
      </CardContent>
    </Card>
  );
}
