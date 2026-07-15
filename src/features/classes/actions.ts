"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { classSchema } from "@/features/classes/schema";
import type { ActionState } from "@/lib/types/action-state";

export async function createClass(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = classSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const { error } = await supabase
    .from("classes")
    .insert({ school_id: schoolId, name: parsed.data.name });

  if (error) {
    return { status: "error", message: "Couldn't add the class. Please try again." };
  }

  revalidatePath(`/${schoolSlug}/classes`);
  return { status: "success" };
}

export async function renameClass(
  schoolSlug: string,
  classId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = classSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const { error } = await supabase
    .from("classes")
    .update({ name: parsed.data.name })
    .eq("id", classId)
    .eq("school_id", schoolId);

  if (error) {
    return { status: "error", message: "Couldn't rename the class. Please try again." };
  }

  revalidatePath(`/${schoolSlug}/classes`);
  return { status: "success" };
}
