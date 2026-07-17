import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Matches the locked Dashboard mockup: label + a small rounded-square icon
// chip on the top row (label left, chip right), the value big below it, then
// delta + sparkline. The chip colour is SEMANTIC — it encodes what kind of
// metric this is (money in = green, money out = red, a standing cash balance
// = brand teal, something needing attention = amber) — not one accent spent
// on every card for decoration. That's the distinction the roadmap drew:
// colour has to mean something on a financial screen.
type Accent = "income" | "expense" | "neutral" | "attention";

const ACCENT: Record<Accent, { chip: string; stroke: string }> = {
  income: { chip: "bg-success/10 text-success", stroke: "var(--success)" },
  expense: { chip: "bg-destructive/10 text-destructive", stroke: "var(--destructive)" },
  neutral: { chip: "bg-primary/10 text-primary", stroke: "var(--primary)" },
  attention: { chip: "bg-warning/10 text-warning", stroke: "var(--warning)" },
};

function Sparkline({ data, stroke }: { data: number[]; stroke: string }) {
  if (data.length < 2 || data.every((v) => v === 0)) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 22;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-2 hidden h-5 w-full @[170px]:block"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
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
  accent = "neutral",
  caption,
  trend,
  deltaPercent,
  goodDirection = "up",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: Accent;
  caption?: string;
  trend?: number[];
  deltaPercent?: number;
  /** Which direction of change is good news for this metric — e.g. Today's
   * Expenses going down is good, so it passes "down". Only affects colour;
   * the arrow always reflects the actual direction of change. */
  goodDirection?: "up" | "down";
}) {
  const isGood =
    deltaPercent !== undefined &&
    (goodDirection === "up" ? deltaPercent >= 0 : deltaPercent <= 0);
  const a = ACCENT[accent];

  return (
    <Card size="sm" className="@container overflow-hidden">
      <CardContent className="px-3.5 py-3 @[200px]:px-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground @[200px]:text-[13px]">{label}</p>
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-lg @[200px]:size-7",
              a.chip
            )}
          >
            <Icon className="size-3.5 @[200px]:size-4" />
          </div>
        </div>

        {/* Value stays mono + tabular so every figure in the product lines up
            like a real statement; shrinks a step on genuinely narrow cards so
            "₹4,63,100" never clips, but caps at text-xl — the mockup's
            restrained scale, not a hero-stat size. */}
        <p className="mt-2 font-mono text-lg font-semibold tabular-nums @[200px]:text-xl">
          {value}
        </p>

        {caption && <p className="mt-1 text-[11px] text-muted-foreground">{caption}</p>}

        {deltaPercent !== undefined && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-[11px] font-medium tabular-nums",
              isGood ? "text-success" : "text-destructive"
            )}
          >
            {deltaPercent >= 0 ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {Math.abs(deltaPercent).toFixed(1)}% vs yesterday
          </p>
        )}

        {trend && <Sparkline data={trend} stroke={a.stroke} />}
      </CardContent>
    </Card>
  );
}
