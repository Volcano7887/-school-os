import { Receipt, Paperclip, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getExpenseCategories, getVendors, getExpenses } from "@/lib/expenses/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ManageCategoriesDialog } from "./manage-categories-dialog";
import { ManageVendorsDialog } from "./manage-vendors-dialog";
import { ExpenseFormDialog } from "./expense-form-dialog";

const PAYMENT_MODE_LABEL: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  upi: "UPI",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const { schoolSlug } = await params;
  const { categoryId = "" } = await searchParams;

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const [categories, vendors, expenses] = await Promise.all([
    getExpenseCategories(supabase, schoolId),
    getVendors(supabase, schoolId),
    getExpenses(supabase, schoolId, { categoryId }),
  ]);

  const totalThisList = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Expenses" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            {expenses.length} expense{expenses.length === 1 ? "" : "s"} · ₹
            {(totalThisList / 100).toLocaleString("en-IN")} total
          </p>
        </div>
        <div className="flex gap-2">
          <ManageCategoriesDialog schoolSlug={schoolSlug} categories={categories} />
          <ManageVendorsDialog schoolSlug={schoolSlug} vendors={vendors} />
          <ExpenseFormDialog
            schoolSlug={schoolSlug}
            categories={categories}
            vendors={vendors}
            trigger={
              <Button size="sm">
                <Plus className="size-4" />
                Add Expense
              </Button>
            }
          />
        </div>
      </div>

      {categories.length === 0 && (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          No expense categories yet — add one via &quot;Categories&quot; above
          before recording an expense.
        </p>
      )}

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <Receipt className="size-8 text-muted-foreground" />
          <p className="font-medium">No expenses recorded yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first expense to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Bill No.</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.expenseDate)}</TableCell>
                    <TableCell className="font-medium">{e.categoryName}</TableCell>
                    <TableCell>{e.vendorName ?? "—"}</TableCell>
                    <TableCell>₹{(e.amount / 100).toLocaleString("en-IN")}</TableCell>
                    <TableCell>{PAYMENT_MODE_LABEL[e.paymentMode]}</TableCell>
                    <TableCell>{e.billNo ?? "—"}</TableCell>
                    <TableCell>
                      {e.hasAttachment && (
                        <Paperclip className="size-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 sm:hidden">
            {expenses.map((e) => (
              <div key={e.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{e.categoryName}</span>
                  <span>₹{(e.amount / 100).toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm text-muted-foreground">
                  <span>{formatDate(e.expenseDate)}</span>
                  <span>
                    {e.vendorName ?? "No vendor"} · {PAYMENT_MODE_LABEL[e.paymentMode]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
