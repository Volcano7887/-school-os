"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { createStaffSchema, salaryPaymentSchema } from "@/features/salary/schema";
import type { ActionState } from "@/lib/types/action-state";

export async function createStaff(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createStaffSchema.safeParse({
    fullName: formData.get("fullName"),
    designation: formData.get("designation") || undefined,
    phone: formData.get("phone") || undefined,
    monthlySalary: formData.get("monthlySalary"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const { error } = await supabase.from("staff").insert({
    school_id: schoolId,
    full_name: parsed.data.fullName,
    designation: parsed.data.designation || null,
    phone: parsed.data.phone || null,
    monthly_salary: Math.round(parsed.data.monthlySalary * 100),
  });

  if (error) {
    return { status: "error", message: "Couldn't add the staff member. Please try again." };
  }

  revalidatePath(`/${schoolSlug}/salary`);
  return { status: "success" };
}

export async function paySalary(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const payMonthRaw = formData.get("payMonth"); // "YYYY-MM" from <input type="month">
  const parsed = salaryPaymentSchema.safeParse({
    staffId: formData.get("staffId"),
    amount: formData.get("amount"),
    paymentMode: formData.get("paymentMode"),
    payMonth: typeof payMonthRaw === "string" ? `${payMonthRaw}-01` : undefined,
    paidAt: formData.get("paidAt"),
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

  const { data, error } = await supabase.rpc("record_salary_payment", {
    p_school_id: schoolId,
    p_staff_id: parsed.data.staffId,
    p_amount: Math.round(parsed.data.amount * 100),
    p_payment_mode: parsed.data.paymentMode,
    p_pay_month: parsed.data.payMonth,
    p_paid_at: parsed.data.paidAt,
    p_remarks: parsed.data.remarks || null,
    p_recorded_by: user.id,
  });

  if (error || !data) {
    const message = error?.code === "23505"
      ? "This staff member has already been paid for that month."
      : "Couldn't record the payment. Please try again.";
    return { status: "error", message };
  }

  revalidatePath(`/${schoolSlug}/salary`);
  return { status: "success" };
}
