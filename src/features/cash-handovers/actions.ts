"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import type { ActionState } from "@/lib/types/action-state";

export async function recordCashHandover(
  schoolSlug: string,
  amount: number,
  note: string
): Promise<ActionState> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { status: "error", message: "Enter a valid amount." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const { error } = await supabase.rpc("record_cash_handover", {
    p_school_id: schoolId,
    p_amount: Math.round(amount * 100),
    p_note: note || null,
    p_received_by: user.id,
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("exceeds")
        ? "That's more than what's currently held by the accountant."
        : error.message.includes("not authorized")
          ? "Only a Principal or Admin can receive a cash handover."
          : "Couldn't record the handover. Please try again.",
    };
  }

  revalidatePath(`/${schoolSlug}/dashboard`);
  revalidatePath(`/${schoolSlug}/cash-book`);
  revalidatePath(`/${schoolSlug}/ledger`);
  return { status: "success" };
}
