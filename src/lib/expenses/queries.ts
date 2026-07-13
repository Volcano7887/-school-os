import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type ExpenseCategory = {
  id: string;
  name: string;
};

export async function getExpenseCategories(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("id, name")
    .eq("school_id", schoolId)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data;
}

export type Vendor = {
  id: string;
  name: string;
};

export async function getVendors(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("school_id", schoolId)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data;
}

export type ExpenseListItem = {
  id: string;
  categoryName: string;
  vendorName: string | null;
  amount: number;
  paymentMode: string;
  expenseDate: string;
  billNo: string | null;
  remarks: string | null;
  hasAttachment: boolean;
};

export async function getExpenses(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  filters: { categoryId?: string }
): Promise<ExpenseListItem[]> {
  let query = supabase
    .from("expenses")
    .select(
      "id, expense_category_id, vendor_id, amount, payment_mode, expense_date, bill_no, remarks, bill_attachment_path"
    )
    .eq("school_id", schoolId)
    .order("expense_date", { ascending: false });

  if (filters.categoryId) query = query.eq("expense_category_id", filters.categoryId);

  const { data: expenses, error } = await query;
  if (error || !expenses) return [];

  const [categories, vendors] = await Promise.all([
    getExpenseCategories(supabase, schoolId),
    getVendors(supabase, schoolId),
  ]);
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const vendorNameById = new Map(vendors.map((v) => [v.id, v.name]));

  return expenses.map((e) => ({
    id: e.id,
    categoryName: categoryNameById.get(e.expense_category_id) ?? "—",
    vendorName: e.vendor_id ? (vendorNameById.get(e.vendor_id) ?? null) : null,
    amount: e.amount,
    paymentMode: e.payment_mode,
    expenseDate: e.expense_date,
    billNo: e.bill_no,
    remarks: e.remarks,
    hasAttachment: !!e.bill_attachment_path,
  }));
}
