"use client";

import { useState } from "react";
import Link from "next/link";
import { Paperclip, Receipt } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ExpenseListItem } from "@/lib/expenses/queries";

const PAYMENT_MODE_LABEL: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  upi: "UPI",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function ExpenseCards({
  schoolSlug,
  expenses,
}: {
  schoolSlug: string;
  expenses: ExpenseListItem[];
}) {
  const [selected, setSelected] = useState<ExpenseListItem | null>(null);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {expenses.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setSelected(e)}
            className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-9 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                <Receipt className="size-4.5" />
              </div>
              {e.hasAttachment && (
                <Paperclip className="size-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">{e.categoryName}</p>
              <p className="text-sm text-muted-foreground">
                {e.vendorName ?? "No vendor"}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{formatDate(e.expenseDate)}</span>
              <span className="font-semibold">{inr(e.amount)}</span>
            </div>
          </button>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.categoryName}</SheetTitle>
              </SheetHeader>
              <div className="space-y-3 px-4 pb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">{inr(selected.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(selected.expenseDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor</span>
                  <span>{selected.vendorName ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Mode</span>
                  <span>{PAYMENT_MODE_LABEL[selected.paymentMode]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bill No.</span>
                  <span>{selected.billNo ?? "—"}</span>
                </div>
                {selected.remarks && (
                  <div>
                    <p className="text-muted-foreground">Remarks</p>
                    <p>{selected.remarks}</p>
                  </div>
                )}
                {selected.hasAttachment && (
                  <Link
                    href={`/${schoolSlug}/bills`}
                    className="block rounded-md border px-3 py-2 text-center font-medium hover:bg-muted"
                  >
                    View Bill Attachment
                  </Link>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
