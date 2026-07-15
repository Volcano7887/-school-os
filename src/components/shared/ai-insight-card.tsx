import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Decorative only — no real analysis is computed yet.
const DECORATIVE_TREND = [4, 6, 5, 8, 7, 10, 12];

export function AiInsightCard() {
  const w = 120;
  const h = 32;
  const max = Math.max(...DECORATIVE_TREND);
  const points = DECORATIVE_TREND.map((v, i) => {
    const x = (i / (DECORATIVE_TREND.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <Card className="border-accent bg-accent/40">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <p className="font-medium">AI Insight</p>
          </div>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            Upcoming Feature
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Automatic insights about fee trends, likely defaulters, and spending
          patterns will show up here — nothing is computed yet.
        </p>
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-8 w-full opacity-40" aria-hidden="true">
          <polyline
            points={points}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CardContent>
    </Card>
  );
}
