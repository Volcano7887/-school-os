"use client";

import { useState } from "react";
import { Sparkles, Bell } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Decorative only — no real analysis is computed yet. Text/shape mirror
// the reference mockup's example insight so the card reads as "real"
// even though nothing here is actually computed. Each slide is split into
// explicit before/bold/afterBold segments (first sentence) plus a second
// sentence rendered on its own line, matching the mockup's two-line layout
// — not a single flowing paragraph that wraps wherever the container
// happens to break it.
const SLIDES: {
  before: string;
  bold: string;
  afterBold: string;
  secondLine: string;
  trend: number[];
}[] = [
  {
    before: "Fee collection is ",
    bold: "18% lower",
    afterBold: " than last month.",
    secondLine: "Consider reminding 25 students with dues.",
    trend: [4, 6, 5, 8, 7, 10, 12],
  },
  {
    before: "",
    bold: "12 students",
    afterBold: " are 2+ months overdue on fees.",
    secondLine: "This is the highest-risk group to follow up with first.",
    trend: [10, 8, 9, 6, 7, 5, 4],
  },
  {
    before: "",
    bold: "Stationary spending",
    afterBold: " is up 30% this month.",
    secondLine: "That's well above your 6-month average.",
    trend: [3, 5, 6, 5, 8, 9, 11],
  },
  {
    before: "",
    bold: "Salary",
    afterBold: " is your largest expense category.",
    secondLine: "It makes up 41% of total spend this month.",
    trend: [6, 6, 7, 8, 8, 9, 10],
  },
  {
    before: "Fee recovery is at ",
    bold: "72%",
    afterBold: " for this year.",
    secondLine: "That's on track versus the same point last year.",
    trend: [5, 7, 6, 9, 8, 11, 13],
  },
];

function Sparkline({ data }: { data: number[] }) {
  const w = 120;
  const h = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const coords = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * h,
  }));
  const points = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-9 w-full" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="2.5" fill="var(--primary)" />
      ))}
    </svg>
  );
}

export function AiInsightCard() {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];

  return (
    <Card className="border-accent bg-accent/40">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <p className="font-medium">AI Insight</p>
          </div>
          <button
            type="button"
            onClick={() =>
              toast.success("We'll let you know when AI Insights is ready.")
            }
            className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Bell className="size-3" />
            Notify Me
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {current.before}
          <span className="font-semibold text-foreground">{current.bold}</span>
          {current.afterBold}
          <br />
          {current.secondLine}
        </p>
        <Sparkline data={current.trend} />

        <div className="mt-3 flex items-center justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setSlide(i)}
              className={cn(
                "size-1.5 rounded-full transition-all",
                i === slide ? "w-4 bg-primary" : "bg-primary/25"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
