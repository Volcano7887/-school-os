"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { feeStructureSchema, feePaymentSchema } from "@/features/fees/schema";
import type { ActionState } from "@/lib/types/action-state";

export async function createFeeStructure(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = feeStructureSchema.safeParse({
    feeType: formData.get("feeType"),
    name: formData.get("name"),
    amount: formData.get("amount"),
    classId: formData.get("classId") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const academicYear = await getCurrentAcademicYear(supabase, schoolId);
  if (!academicYear) {
    return { status: "error", message: "Set up an academic year first." };
  }

  const { error } = await supabase.from("fee_structures").insert({
    school_id: schoolId,
    academic_year_id: academicYear.id,
    class_id: parsed.data.classId || null,
    fee_type: parsed.data.feeType,
    name: parsed.data.name,
    amount: Math.round(parsed.data.amount * 100),
  });

  if (error) {
    return { status: "error", message: "Couldn't create the fee structure. Please try again." };
  }

  revalidatePath(`/${schoolSlug}/fees`);
  return { status: "success" };
}

export async function recordFeePayment(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = feePaymentSchema.safeParse({
    studentId: formData.get("studentId"),
    feeType: formData.get("feeType"),
    amount: formData.get("amount"),
    paymentMode: formData.get("paymentMode"),
    paidAt: formData.get("paidAt"),
    periodLabel: formData.get("periodLabel") || undefined,
    remarks: formData.get("remarks") || undefined,
    discountAmount: formData.get("discountAmount") || undefined,
    fineAmount: formData.get("fineAmount") || undefined,
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

  const academicYear = await getCurrentAcademicYear(supabase, schoolId);
  if (!academicYear) {
    return { status: "error", message: "Set up an academic year first." };
  }

  const { data, error } = await supabase.rpc("record_fee_payment", {
    p_school_id: schoolId,
    p_student_id: parsed.data.studentId,
    p_academic_year_id: academicYear.id,
    p_fee_type: parsed.data.feeType,
    p_amount: Math.round(parsed.data.amount * 100),
    p_payment_mode: parsed.data.paymentMode,
    p_paid_at: parsed.data.paidAt,
    p_period_label: parsed.data.periodLabel || null,
    p_remarks: parsed.data.remarks || null,
    p_recorded_by: user.id,
    p_discount_amount: Math.round((parsed.data.discountAmount ?? 0) * 100),
    p_fine_amount: Math.round((parsed.data.fineAmount ?? 0) * 100),
  });

  if (error || !data) {
    return { status: "error", message: "Couldn't record the payment. Please try again." };
  }

  revalidatePath(`/${schoolSlug}/fees`);
  revalidatePath(`/${schoolSlug}/students/${parsed.data.studentId}`);
  return {
    status: "success",
    message: data.receipt_no,
    data: { paymentId: data.id },
  };
}
