"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import {
  createExpenseCategorySchema,
  createVendorSchema,
  expenseSchema,
} from "@/features/expenses/schema";
import type { ActionState } from "@/lib/types/action-state";

export async function createExpenseCategory(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createExpenseCategorySchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const { count } = await supabase
    .from("ledger_accounts")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("type", "expense");

  const code = `5${String(count ?? 0).padStart(3, "0")}`;

  const { data: account, error: accountError } = await supabase
    .from("ledger_accounts")
    .insert({ school_id: schoolId, code, name: parsed.data.name, type: "expense" })
    .select("id")
    .single();

  if (accountError || !account) {
    return { status: "error", message: "Couldn't create the category. Please try again." };
  }

  const { error } = await supabase.from("expense_categories").insert({
    school_id: schoolId,
    name: parsed.data.name,
    ledger_account_id: account.id,
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "A category with that name already exists."
        : "Couldn't create the category. Please try again.";
    return { status: "error", message };
  }

  revalidatePath(`/${schoolSlug}/expenses`);
  return { status: "success" };
}

export async function createVendor(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createVendorSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const { error } = await supabase.from("vendors").insert({
    school_id: schoolId,
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
  });

  if (error) {
    return { status: "error", message: "Couldn't add the vendor. Please try again." };
  }

  revalidatePath(`/${schoolSlug}/expenses`);
  return { status: "success" };
}

export async function createExpense(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = expenseSchema.safeParse({
    categoryId: formData.get("categoryId"),
    vendorId: formData.get("vendorId") || undefined,
    amount: formData.get("amount"),
    paymentMode: formData.get("paymentMode"),
    expenseDate: formData.get("expenseDate"),
    billNo: formData.get("billNo") || undefined,
    remarks: formData.get("remarks") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  let billAttachmentPath: string | null = null;
  const bill = formData.get("bill");
  if (bill instanceof File && bill.size > 0) {
    const safeName = bill.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${schoolId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("bills").upload(path, bill);
    if (uploadError) {
      return { status: "error", message: "Couldn't upload the bill. Please try again." };
    }
    billAttachmentPath = path;
  }

  const { data, error } = await supabase.rpc("record_expense", {
    p_school_id: schoolId,
    p_expense_category_id: parsed.data.categoryId,
    p_vendor_id: parsed.data.vendorId || null,
    p_amount: Math.round(parsed.data.amount * 100),
    p_payment_mode: parsed.data.paymentMode,
    p_expense_date: parsed.data.expenseDate,
    p_bill_no: parsed.data.billNo || null,
    p_remarks: parsed.data.remarks || null,
    p_bill_attachment_path: billAttachmentPath,
    p_recorded_by: user.id,
  });

  if (error || !data) {
    return { status: "error", message: "Couldn't save the expense. Please try again." };
  }

  revalidatePath(`/${schoolSlug}/expenses`);
  return { status: "success" };
}
