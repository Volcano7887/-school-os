"use client";

import { useActionState, useState } from "react";
import { createFeeStructure } from "@/features/fees/actions";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FeeStructure } from "@/lib/fees/queries";
import type { SchoolClass } from "@/lib/students/queries";

const FEE_TYPE_LABEL: Record<string, string> = {
  tuition: "Tuition",
  admission: "Admission",
  exam: "Exam",
  arrears: "Arrears",
};

export function FeeStructureDialog({
  schoolSlug,
  structures,
  classes,
}: {
  schoolSlug: string;
  structures: FeeStructure[];
  classes: SchoolClass[];
}) {
  const [open, setOpen] = useState(false);
  const action = createFeeStructure.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Fee structures
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fee structures (this academic year)</DialogTitle>
        </DialogHeader>

        {structures.length > 0 ? (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {structures.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
              >
                <span>
                  {s.name}{" "}
                  <span className="text-muted-foreground">
                    ({FEE_TYPE_LABEL[s.feeType]} · {s.className ?? "All classes"})
                  </span>
                </span>
                <span className="font-medium">₹{(s.amount / 100).toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No fee structures yet — add your first one below.
          </p>
        )}

        <form action={formAction} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="feeType">Type</Label>
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
              <Label htmlFor="classId">Class</Label>
              <Select name="classId">
                <SelectTrigger id="classId" className="w-full">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. Monthly Tuition" required />
              {state.fieldErrors?.name && (
                <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (₹, for the year)</Label>
              <Input id="amount" name="amount" type="number" min="1" step="1" required />
              {state.fieldErrors?.amount && (
                <p className="text-sm text-destructive">{state.fieldErrors.amount[0]}</p>
              )}
            </div>
          </div>

          {state.status === "error" && state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Adding…" : "Add fee structure"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
