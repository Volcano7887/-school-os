import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ICON_COLORS = {
  green: "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
} as const;

export type StatCardColor = keyof typeof ICON_COLORS;

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  caption,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: StatCardColor;
  caption?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            ICON_COLORS[color]
          )}
        >
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
          {caption && (
            <p className="text-xs text-muted-foreground">{caption}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
