"use client";

import { useActionState, useState } from "react";
import { createExpenseCategory } from "@/features/expenses/actions";
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
import type { ExpenseCategory } from "@/lib/expenses/queries";

export function ManageCategoriesDialog({
  schoolSlug,
  categories,
}: {
  schoolSlug: string;
  categories: ExpenseCategory[];
}) {
  const [open, setOpen] = useState(false);
  const action = createExpenseCategory.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Categories
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Expense categories</DialogTitle>
        </DialogHeader>

        {categories.length > 0 ? (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {categories.map((c) => (
              <li key={c.id} className="rounded-md border px-3 py-1.5 text-sm">
                {c.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No categories yet — add your first one below (e.g. Utilities,
            Maintenance, Supplies).
          </p>
        )}

        <form action={formAction} className="flex items-end gap-2" noValidate>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="category-name">New category</Label>
            <Input id="category-name" name="name" placeholder="e.g. Utilities" required />
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
