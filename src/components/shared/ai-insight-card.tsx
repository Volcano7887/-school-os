"use client";

import { useState } from "react";
import { Sparkles, Bell } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Decorative only — no real analysis is computed yet.
const TRENDS: number[][] = [
  [4, 6, 5, 8, 7, 10, 12],
  [10, 8, 9, 6, 7, 5, 4],
  [3, 5, 6, 5, 8, 9, 11],
];

const SLIDES = [
  "Automatic insights about fee trends, likely defaulters, and spending patterns will show up here — nothing is computed yet.",
  "Spot students likely to fall behind on fees before it happens, based on their payment history.",
  "Get alerted to unusual spending patterns the moment they show up in your expenses.",
];

function Sparkline({ data }: { data: number[] }) {
  const w = 120;
  const h = 32;
  const max = Math.max(...data);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
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
  );
}

export function AiInsightCard() {
  const totalSlides = SLIDES.length + 1;
  const [slide, setSlide] = useState(0);
  const isLastSlide = slide === SLIDES.length;

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

        {isLastSlide ? (
          <div className="mt-3 flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Want to know the moment AI Insights launches?
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                toast.success("We'll let you know when AI Insights is ready.")
              }
            >
              <Bell className="size-4" />
              Notify me when available
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">{SLIDES[slide]}</p>
            <Sparkline data={TRENDS[slide]} />
          </>
        )}

        <div className="mt-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
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
