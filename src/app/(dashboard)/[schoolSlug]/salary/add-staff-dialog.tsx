"use client";

import { useActionState, useEffect, useState } from "react";
import { createStaff } from "@/features/salary/actions";
import { initialActionState } from "@/lib/types/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddStaffDialog({
  schoolSlug,
  trigger,
}: {
  schoolSlug: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const action = createStaff.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      // Syncing to the server action's result, not deriving render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Staff</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required />
            {state.fieldErrors?.fullName && (
              <p className="text-sm text-destructive">{state.fieldErrors.fullName[0]}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" name="designation" placeholder="Optional" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" placeholder="Optional" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="monthlySalary">Monthly salary (₹)</Label>
            <Input id="monthlySalary" name="monthlySalary" type="number" min="1" step="1" required />
            {state.fieldErrors?.monthlySalary && (
              <p className="text-sm text-destructive">{state.fieldErrors.monthlySalary[0]}</p>
            )}
          </div>
          {state.status === "error" && state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Adding…" : "Add staff"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
