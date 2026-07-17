import Link from "next/link";
import { AlertTriangle, Clock, CheckCircle2, Bell, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type ActionCenterAlert = {
  id: string;
  label: string;
  meta: string;
  href: string;
  priority: "high" | "attention";
};

export function ActionCenter({
  schoolSlug,
  alerts,
}: {
  schoolSlug: string;
  alerts: ActionCenterAlert[];
}) {
  return (
    <Card>
      <CardContent>
        <div className="mb-2 flex items-center gap-1.5">
          <Bell className="size-4 text-muted-foreground" />
          <p className="font-medium">Action Center</p>
        </div>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-success" />
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
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"
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
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {isHigh ? "High Priority" : "Attention"} · {alert.meta}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {alerts.length > 0 && (
          <Link
            href={`/${schoolSlug}/audit-log`}
            className="mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all alerts
            <ChevronRight className="size-3.5" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
