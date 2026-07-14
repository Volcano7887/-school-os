"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordFeePayment } from "@/features/fees/actions";
import { initialActionState } from "@/lib/types/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StudentBalance } from "@/lib/fees/queries";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function RecordPaymentDialog({
  schoolSlug,
  student,
  trigger,
}: {
  schoolSlug: string;
  student: StudentBalance;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const router = useRouter();
  const printAfterSave = useRef(false);
  const action = recordFeePayment.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      // Syncing to an external signal (the server action's result), not
      // deriving render state — closing the dialog here is correct.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      const paymentId = state.data?.paymentId;

      if (printAfterSave.current && paymentId) {
        router.push(`/${schoolSlug}/fees/receipts/${paymentId}`);
        return;
      }

      toast.success(
        state.message ? `Payment recorded — receipt ${state.message}` : "Payment recorded",
        paymentId
          ? {
              action: {
                label: "View Receipt",
                onClick: () => router.push(`/${schoolSlug}/fees/receipts/${paymentId}`),
              },
            }
          : undefined
      );
    }
  }, [state.status, state.message, state.data, router, schoolSlug]);

  const amountPaise = Math.round((amount || 0) * 100);
  const previewBalance = student.balance - amountPaise;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setAmount(0);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fee Collection</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          {/* Left: student info + Total Due */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Avatar size="lg">
                <AvatarFallback>{initials(student.fullName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{student.fullName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {student.className ?? "No class"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                {student.balance < 0 ? "Advance" : "Total Due"}
              </p>
              <p
                className={`text-2xl font-semibold ${
                  student.balance > 0 ? "text-destructive" : ""
                }`}
              >
                {inr(Math.abs(student.balance))}
              </p>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href={`/${schoolSlug}/students/${student.studentId}`}>View History</Link>
            </Button>
          </div>

          {/* Right: Collection Details form + live Summary */}
          <div className="space-y-4">
            <form id="collection-form" action={formAction} className="space-y-4" noValidate>
              <input type="hidden" name="studentId" value={student.studentId} />

              <p className="text-sm font-medium">Collection Details</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="feeType">Fee type</Label>
                  <Select name="feeType" defaultValue="tuition">
                    <SelectTrigger id="feeType" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tuition">Tuition</SelectItem>
                      <SelectItem value="admission">Admission</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="arrears">Arrears</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount Received (₹)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                  {state.fieldErrors?.amount && (
                    <p className="text-sm text-destructive">{state.fieldErrors.amount[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="paymentMode">Payment Mode</Label>
                  <Select name="paymentMode" defaultValue="cash">
                    <SelectTrigger id="paymentMode" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paidAt">Date</Label>
                  <Input id="paidAt" name="paidAt" type="date" defaultValue={todayIso()} required />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="periodLabel">Period (optional)</Label>
                <Input id="periodLabel" name="periodLabel" placeholder="e.g. June, Term 1" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Input id="remarks" name="remarks" placeholder="Optional" />
              </div>

              {state.status === "error" && state.message && (
                <p className="text-sm text-destructive">{state.message}</p>
              )}
            </form>

            <div className="space-y-1 rounded-lg border p-3 text-sm">
              <p className="mb-1 font-medium">Summary</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous Paid</span>
                <span>{inr(student.totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Due</span>
                <span>{inr(student.totalDue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Received</span>
                <span>{inr(amountPaise)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{previewBalance < 0 ? "Advance" : "Balance"}</span>
                <span>{inr(Math.abs(previewBalance))}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                form="collection-form"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  printAfterSave.current = true;
                }}
              >
                Save & Print Receipt
              </Button>
              <Button
                type="submit"
                form="collection-form"
                disabled={isPending}
                onClick={() => {
                  printAfterSave.current = false;
                }}
              >
                {isPending ? "Saving…" : "Save Collection"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
