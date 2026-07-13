"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { recordFeePayment } from "@/features/fees/actions";
import { initialActionState } from "@/lib/types/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StudentBalance } from "@/lib/fees/queries";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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
  const action = recordFeePayment.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      // Syncing to an external signal (the server action's result), not
      // deriving render state — closing the dialog here is correct.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      toast.success(
        state.message ? `Payment recorded — receipt ${state.message}` : "Payment recorded"
      );
    }
  }, [state.status, state.message]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {student.fullName} — {student.className ?? "No class"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 rounded-lg border p-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Total Due</p>
            <p className="font-semibold">₹{(student.totalDue / 100).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid So Far</p>
            <p className="font-semibold">₹{(student.totalPaid / 100).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {student.balance < 0 ? "Advance" : "Balance"}
            </p>
            <p className="font-semibold">
              ₹{(Math.abs(student.balance) / 100).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="studentId" value={student.studentId} />

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
              <Input id="amount" name="amount" type="number" min="1" step="1" required />
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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : "Save Collection"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
