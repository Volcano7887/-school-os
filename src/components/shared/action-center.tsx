import Link from "next/link";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type ActionCenterAlert = {
  id: string;
  label: string;
  meta: string;
  href: string;
  priority: "high" | "attention";
};

export function ActionCenter({ alerts }: { alerts: ActionCenterAlert[] }) {
  return (
    <Card>
      <CardContent>
        <p className="mb-2 font-medium">Action Center</p>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
            All caught up — nothing needs your attention.
          </div>
        ) : (
          <ul className="divide-y">
            {alerts.map((alert) => {
              const isHigh = alert.priority === "high";
              return (
                <li key={alert.id}>
                  <Link
                    href={alert.href}
                    className="flex items-center gap-3 py-2.5 hover:bg-muted/50"
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        isHigh
                          ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
                      }`}
                    >
                      {isHigh ? (
                        <AlertTriangle className="size-4" />
                      ) : (
                        <Clock className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{alert.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {isHigh ? "High Priority" : "Attention"} · {alert.meta}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
