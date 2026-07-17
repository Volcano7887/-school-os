import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// One consistent treatment for every stat card — the old version color-coded
// each metric (purple/green/orange/red) as pure decoration. Semantic color
// is reserved for status (the delta below), never spent on labeling a
// neutral fact like "this is the expenses card."
function Sparkline({ data }: { data: number[] }) {
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
        stroke="var(--primary)"
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
  caption,
  trend,
  deltaPercent,
  goodDirection = "up",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
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
    <Card size="sm" className="@container overflow-hidden">
      {/* h-full + justify-center: cards in the same grid row stretch to
          match the tallest one (some have a delta/sparkline, some don't) —
          without this, a short-content card ends up with its icon/text
          pinned to the top and a big dead gap below instead of looking
          intentional. */}
      <CardContent className="flex h-full flex-col justify-center px-3 @[220px]:px-6">
        <div className="flex items-start gap-1.5 @[220px]:gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary @[220px]:size-11">
            <Icon className="size-3.5 @[220px]:size-5.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight text-muted-foreground">{label}</p>
            {/* Value font shrinks when the CARD ITSELF is narrow (container
                query, not viewport) — this is the one thing on the card
                that must never clip: a bold 24px number needs ~115px for
                something like "₹4,63,100", which a ~160px-wide card simply
                doesn't have at the default size. font-mono + tabular-nums:
                every figure in the product lines up like a real statement. */}
            <p className="font-mono text-base font-bold tabular-nums @[220px]:text-2xl">
              {value}
            </p>
            {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
            {deltaPercent !== undefined && (
              <p
                className={cn(
                  "mt-0.5 flex items-center gap-1 text-xs font-medium tabular-nums",
                  isGood ? "text-success" : "text-destructive"
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
        {trend && <Sparkline data={trend} />}
      </CardContent>
    </Card>
  );
}
