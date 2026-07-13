"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { createAcademicYearSchema } from "@/features/academic-years/schema";
import type { ActionState } from "@/lib/types/action-state";

export async function createAcademicYear(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createAcademicYearSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  // Only one academic year can be "current" at a time (enforced by a
  // partial unique index) — clear any existing one first.
  await supabase
    .from("academic_years")
    .update({ is_current: false })
    .eq("school_id", schoolId)
    .eq("is_current", true);

  const { error } = await supabase.from("academic_years").insert({
    school_id: schoolId,
    name: parsed.data.name,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    is_current: true,
  });

  if (error) {
    return { status: "error", message: "Couldn't create the academic year. Please try again." };
  }

  revalidatePath(`/${schoolSlug}/fees`);
  return { status: "success" };
}
