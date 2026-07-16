"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet, HandCoins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { recordCashHandover } from "@/features/cash-handovers/actions";
import { inr } from "@/lib/utils";
import type { CashHandoverRecord } from "@/lib/cash-handovers/queries";

export function CashHandoverCard({
  schoolSlug,
  balance,
  canReceive,
  history,
}: {
  schoolSlug: string;
  balance: number;
  canReceive: boolean;
  history: CashHandoverRecord[];
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(() => (balance / 100).toString());
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    startTransition(async () => {
      const result = await recordCashHandover(schoolSlug, Number(amount), note);
      if (result.status === "success") {
        toast.success("Cash handover recorded.");
        setOpen(false);
        setNote("");
        router.refresh();
      } else {
        toast.error(result.message ?? "Couldn't record the handover.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </div>
          <div>
            <p className="font-medium">Cash with Accountant</p>
            <p className="text-xs text-muted-foreground">
              Collected but not yet handed over to Principal/Admin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-2xl font-bold">{inr(balance)}</p>

          {canReceive && balance > 0 && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <HandCoins className="size-4" />
                  Receive
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Receive cash handover</DialogTitle>
                  <DialogDescription>
                    Confirm the amount you physically received from the accountant.
                    Currently held: {inr(balance)}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="handover-amount">Amount received (₹)</Label>
                    <Input
                      id="handover-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={balance / 100}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="handover-note">Note (optional)</Label>
                    <Input
                      id="handover-note"
                      placeholder="e.g. Received in person, Friday evening"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSubmit} disabled={isPending}>
                    {isPending ? "Recording…" : "Confirm Receipt"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>

      {history.length > 0 && (
        <CardContent className="border-t pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Recent handovers</p>
          <ul className="space-y-1.5">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Received by {h.receivedByName}
                  {h.note ? ` · ${h.note}` : ""}
                </span>
                <span className="font-medium">{inr(h.amount)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
