"use client";

import { useActionState, useState } from "react";
import { createVendor } from "@/features/expenses/actions";
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
import type { Vendor } from "@/lib/expenses/queries";

export function ManageVendorsDialog({
  schoolSlug,
  vendors,
}: {
  schoolSlug: string;
  vendors: Vendor[];
}) {
  const [open, setOpen] = useState(false);
  const action = createVendor.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Vendors
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vendors</DialogTitle>
        </DialogHeader>

        {vendors.length > 0 ? (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {vendors.map((v) => (
              <li key={v.id} className="rounded-md border px-3 py-1.5 text-sm">
                {v.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No vendors yet — add your first one below.
          </p>
        )}

        <form action={formAction} className="space-y-3" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="vendor-name">Name</Label>
            <Input id="vendor-name" name="name" required />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="vendor-phone">Phone</Label>
              <Input id="vendor-phone" name="phone" placeholder="Optional" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-email">Email</Label>
              <Input id="vendor-email" name="email" type="email" placeholder="Optional" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Adding…" : "Add vendor"}
          </Button>
        </form>
        {state.status === "error" && state.message && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
