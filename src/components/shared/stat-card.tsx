import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ICON_COLORS = {
  green: "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
} as const;

const GRADIENTS = {
  green: "from-green-50 to-transparent dark:from-green-500/10",
  red: "from-red-50 to-transparent dark:from-red-500/10",
  blue: "from-blue-50 to-transparent dark:from-blue-500/10",
  orange: "from-orange-50 to-transparent dark:from-orange-500/10",
  purple: "from-purple-50 to-transparent dark:from-purple-500/10",
} as const;

const SPARK_COLORS = {
  green: "#16a34a",
  red: "#ef4444",
  blue: "#2563eb",
  orange: "#f59e0b",
  purple: "#9333ea",
} as const;

export type StatCardColor = keyof typeof ICON_COLORS;

function Sparkline({ data, color }: { data: number[]; color: StatCardColor }) {
  if (data.length < 2 || data.every((v) => v === 0)) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-20 shrink-0" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={SPARK_COLORS[color]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  caption,
  trend,
  deltaPercent,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: StatCardColor;
  caption?: string;
  trend?: number[];
  deltaPercent?: number;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden bg-gradient-to-br shadow-sm",
        GRADIENTS[color]
      )}
    >
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
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
            {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
            {deltaPercent !== undefined && (
              <p
                className={cn(
                  "mt-0.5 flex items-center gap-1 text-xs font-medium",
                  deltaPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {deltaPercent >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {Math.abs(deltaPercent).toFixed(0)}% vs yesterday
              </p>
            )}
          </div>
        </div>
        {trend && <Sparkline data={trend} color={color} />}
      </CardContent>
    </Card>
  );
}
