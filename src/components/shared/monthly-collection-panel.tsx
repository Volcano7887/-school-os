"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inr } from "@/lib/utils";
import type { MonthlyIncomeExpense } from "@/lib/dashboard/queries";

export function MonthlyCollectionPanel({
  schoolSlug,
  months,
  monthlyFeeTarget,
}: {
  schoolSlug: string;
  months: MonthlyIncomeExpense[];
  monthlyFeeTarget: number | null;
}) {
  const [selectedIndex, setSelectedIndex] = useState(months.length - 1);
  const selected = months[selectedIndex];

  if (!monthlyFeeTarget) {
    return (
      <Card>
        <CardContent className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <p className="font-medium">Monthly Collection</p>
          <p className="text-sm text-muted-foreground">
            Set a monthly collection goal to track progress here.
          </p>
          <Link
            href={`/${schoolSlug}/settings`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Set goal in Settings
          </Link>
        </CardContent>
      </Card>
    );
  }

  const collected = selected?.income ?? 0;
  const pct = Math.min(Math.round((collected / monthlyFeeTarget) * 100), 100);
  const remaining = Math.max(monthlyFeeTarget - collected, 0);

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium">Monthly Collection</p>
          <Select
            value={String(selectedIndex)}
            onValueChange={(v) => setSelectedIndex(Number(v))}
          >
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={m.month} value={String(i)}>
                  {m.month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-mono font-semibold tabular-nums text-primary">
            {inr(collected)} / {inr(monthlyFeeTarget)}
          </span>
          <span className="font-mono font-medium tabular-nums">{pct}%</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Remaining</span>
          <span className="font-mono tabular-nums">{inr(remaining)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
