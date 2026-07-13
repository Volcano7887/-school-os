"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, X } from "lucide-react";
import { createExpense } from "@/features/expenses/actions";
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
import type { ExpenseCategory, Vendor } from "@/lib/expenses/queries";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseFormDialog({
  schoolSlug,
  categories,
  vendors,
  trigger,
}: {
  schoolSlug: string;
  categories: ExpenseCategory[];
  vendors: Vendor[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [billFileName, setBillFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const action = createExpense.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      // Syncing to the server action's result, not deriving render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      setBillFileName(null);
      toast.success("Expense saved");
    }
  }, [state.status]);

  function clearFile() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setBillFileName(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select name="categoryId">
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No categories yet — use &quot;Categories&quot; first.
                </p>
              )}
              {state.fieldErrors?.categoryId && (
                <p className="text-sm text-destructive">{state.fieldErrors.categoryId[0]}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" name="amount" type="number" min="1" step="1" required />
              {state.fieldErrors?.amount && (
                <p className="text-sm text-destructive">{state.fieldErrors.amount[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expenseDate">Date</Label>
              <Input
                id="expenseDate"
                name="expenseDate"
                type="date"
                defaultValue={todayIso()}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendorId">Vendor</Label>
              <Select name="vendorId">
                <SelectTrigger id="vendorId" className="w-full">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="billNo">Bill / Invoice No.</Label>
              <Input id="billNo" name="billNo" placeholder="Optional" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bill">Upload Bill</Label>
            {/* The real file input stays mounted at all times — swapping it
                for a preview element would drop the selected file from the
                form entirely. It's just visually hidden once a file is picked. */}
            <Input
              ref={fileInputRef}
              id="bill"
              name="bill"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setBillFileName(e.target.files?.[0]?.name ?? null)}
              className={billFileName ? "hidden" : undefined}
            />
            {billFileName && (
              <div className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span className="flex items-center gap-2 truncate">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  {billFileName}
                </span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove file"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input id="remarks" name="remarks" placeholder="Optional" />
          </div>

          {state.status === "error" && state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : "Save Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
