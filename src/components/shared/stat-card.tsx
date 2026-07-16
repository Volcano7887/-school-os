import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ICON_COLORS = {
  green: "bg-green-600 text-white dark:bg-green-500",
  red: "bg-red-600 text-white dark:bg-red-500",
  blue: "bg-blue-600 text-white dark:bg-blue-500",
  orange: "bg-orange-500 text-white dark:bg-orange-400",
  purple: "bg-purple-600 text-white dark:bg-purple-500",
} as const;

const GRADIENTS = {
  green: "from-green-100 to-green-50/60 dark:from-green-500/20 dark:to-green-500/5",
  red: "from-red-100 to-red-50/60 dark:from-red-500/20 dark:to-red-500/5",
  blue: "from-blue-100 to-blue-50/60 dark:from-blue-500/20 dark:to-blue-500/5",
  orange: "from-orange-100 to-orange-50/60 dark:from-orange-500/20 dark:to-orange-500/5",
  purple: "from-purple-100 to-purple-50/60 dark:from-purple-500/20 dark:to-purple-500/5",
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
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-6 w-full" preserveAspectRatio="none" aria-hidden="true">
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
  goodDirection = "up",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: StatCardColor;
  caption?: string;
  trend?: number[];
  deltaPercent?: number;
  /** Which direction of change is good news for this metric — e.g. Today's
   * Expenses going down is good, so it passes "down". Only affects color;
   * the arrow always reflects the actual direction of change. */
  goodDirection?: "up" | "down";
}) {
  const isGood =
    deltaPercent !== undefined &&
    (goodDirection === "up" ? deltaPercent >= 0 : deltaPercent <= 0);
  return (
    <Card
      className={cn(
        "overflow-hidden bg-gradient-to-br shadow-sm",
        GRADIENTS[color]
      )}
    >
      <CardContent>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full",
              ICON_COLORS[color]
            )}
          >
            <Icon className="size-5.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
            {deltaPercent !== undefined && (
              <p
                className={cn(
                  "mt-0.5 flex items-center gap-1 text-xs font-medium",
                  isGood ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
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
