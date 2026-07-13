"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { studentSchema, createClassSchema } from "@/features/students/schema";
import type { ActionState } from "@/lib/types/action-state";

export async function createClass(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createClassSchema.safeParse({ name: formData.get("name") });

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
    const message =
      error.code === "23505"
        ? "A class with that name already exists."
        : "Couldn't create the class. Please try again.";
    return { status: "error", message };
  }

  revalidatePath(`/${schoolSlug}/students`);
  return { status: "success" };
}

export async function createStudent(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = studentSchema.safeParse({
    fullName: formData.get("fullName"),
    classId: formData.get("classId") || undefined,
    admissionNo: formData.get("admissionNo") || undefined,
    gender: formData.get("gender") || undefined,
    dob: formData.get("dob") || undefined,
    guardianName: formData.get("guardianName") || undefined,
    guardianPhone: formData.get("guardianPhone") || undefined,
    guardianEmail: formData.get("guardianEmail") || undefined,
    address: formData.get("address") || undefined,
    admissionDate: formData.get("admissionDate") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const { error } = await supabase.from("students").insert({
    school_id: schoolId,
    class_id: parsed.data.classId || null,
    admission_no: parsed.data.admissionNo || null,
    full_name: parsed.data.fullName,
    gender: parsed.data.gender || null,
    dob: parsed.data.dob || null,
    guardian_name: parsed.data.guardianName || null,
    guardian_phone: parsed.data.guardianPhone || null,
    guardian_email: parsed.data.guardianEmail || null,
    address: parsed.data.address || null,
    admission_date: parsed.data.admissionDate || undefined,
  });

  if (error) {
    return { status: "error", message: "Couldn't add the student. Please try again." };
  }

  revalidatePath(`/${schoolSlug}/students`);
  return { status: "success" };
}

export async function updateStudent(
  schoolSlug: string,
  studentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = studentSchema.safeParse({
    fullName: formData.get("fullName"),
    classId: formData.get("classId") || undefined,
    admissionNo: formData.get("admissionNo") || undefined,
    gender: formData.get("gender") || undefined,
    dob: formData.get("dob") || undefined,
    guardianName: formData.get("guardianName") || undefined,
    guardianPhone: formData.get("guardianPhone") || undefined,
    guardianEmail: formData.get("guardianEmail") || undefined,
    address: formData.get("address") || undefined,
    admissionDate: formData.get("admissionDate") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const { error } = await supabase
    .from("students")
    .update({
      class_id: parsed.data.classId || null,
      admission_no: parsed.data.admissionNo || null,
      full_name: parsed.data.fullName,
      gender: parsed.data.gender || null,
      dob: parsed.data.dob || null,
      guardian_name: parsed.data.guardianName || null,
      guardian_phone: parsed.data.guardianPhone || null,
      guardian_email: parsed.data.guardianEmail || null,
      address: parsed.data.address || null,
      admission_date: parsed.data.admissionDate || undefined,
    })
    .eq("id", studentId)
    .eq("school_id", schoolId);

  if (error) {
    return { status: "error", message: "Couldn't update the student. Please try again." };
  }

  revalidatePath(`/${schoolSlug}/students`);
  revalidatePath(`/${schoolSlug}/students/${studentId}`);
  return { status: "success" };
}
