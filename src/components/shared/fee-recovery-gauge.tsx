import Link from "next/link";
import { Info, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/utils";

export function FeeRecoveryGauge({
  schoolSlug,
  collected,
  totalDue,
  studentsPending,
}: {
  schoolSlug: string;
  collected: number;
  totalDue: number;
  studentsPending: number;
}) {
  const total = collected + totalDue;
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  const size = 96;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-1.5">
          <p className="font-medium">Fee Recovery</p>
          <Info
            className="size-3.5 text-muted-foreground"
            aria-label="Collected vs. total due for the current academic year"
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-6">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--primary)"
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold">{pct}%</span>
              <span className="text-[10px] text-muted-foreground">Recovery Rate</span>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collected</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {inr(collected)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Due</span>
              <span className="font-medium">{inr(total)}</span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium text-destructive">{inr(totalDue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Students Pending</span>
              <span className="font-medium">{studentsPending}</span>
            </div>
          </div>
        </div>

        <Button asChild variant="secondary" className="mt-3 w-full">
          <Link href={`/${schoolSlug}/fees`}>
            View Defaulters
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
