"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { paySalary } from "@/features/salary/actions";
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
import type { StaffMember } from "@/lib/salary/queries";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function PaySalaryDialog({
  schoolSlug,
  staff,
  trigger,
}: {
  schoolSlug: string;
  staff: StaffMember;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const action = paySalary.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      // Syncing to the server action's result, not deriving render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      toast.success(`Salary paid to ${staff.fullName}`);
    }
  }, [state.status, staff.fullName]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Salary</DialogTitle>
          <DialogDescription>
            {staff.fullName} — ₹{(staff.monthlySalary / 100).toLocaleString("en-IN")}/month
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="staffId" value={staff.id} />

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="payMonth">Month</Label>
              <Input
                id="payMonth"
                name="payMonth"
                type="month"
                defaultValue={currentMonth()}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="1"
                step="1"
                defaultValue={staff.monthlySalary / 100}
                required
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
            <Label htmlFor="remarks">Remarks</Label>
            <Input id="remarks" name="remarks" placeholder="Optional" />
          </div>

          {state.status === "error" && state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : "Pay Salary"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
