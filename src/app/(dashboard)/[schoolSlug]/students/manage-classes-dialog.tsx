"use client";

import { useActionState, useState } from "react";
import { createClass } from "@/features/students/actions";
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
import type { SchoolClass } from "@/lib/students/queries";

export function ManageClassesDialog({
  schoolSlug,
  classes,
}: {
  schoolSlug: string;
  classes: SchoolClass[];
}) {
  const [open, setOpen] = useState(false);
  const action = createClass.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Manage classes
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Classes</DialogTitle>
        </DialogHeader>

        {classes.length > 0 ? (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {classes.map((c) => (
              <li
                key={c.id}
                className="rounded-md border px-3 py-1.5 text-sm"
              >
                {c.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No classes yet — add your first one below.
          </p>
        )}

        <form action={formAction} className="flex items-end gap-2" noValidate>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="class-name">New class name</Label>
            <Input id="class-name" name="name" placeholder="e.g. 1st, SR KG" required />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding…" : "Add"}
          </Button>
        </form>
        {state.status === "error" && state.message && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
