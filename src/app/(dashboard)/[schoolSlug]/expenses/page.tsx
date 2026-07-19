import { Receipt, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getExpenseCategories, getVendors, getExpenses } from "@/lib/expenses/queries";
import { Button } from "@/components/ui/button";
import { ManageCategoriesDialog } from "./manage-categories-dialog";
import { ManageVendorsDialog } from "./manage-vendors-dialog";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { ExpenseCards } from "./expense-cards";

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
        <ExpenseCards schoolSlug={schoolSlug} expenses={expenses} />
      )}
    </div>
  );
}
