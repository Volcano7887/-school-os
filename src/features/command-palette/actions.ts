"use server";

import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";

export type CommandPaletteStudent = {
  id: string;
  fullName: string;
  admissionNo: string | null;
  className: string | null;
};

export async function searchStudentsForCommandPalette(
  schoolSlug: string,
  query: string
): Promise<CommandPaletteStudent[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return [];

  const { data: students, error } = await supabase
    .from("students")
    .select("id, full_name, admission_no, class_id")
    .eq("school_id", schoolId)
    .is("deleted_at", null)
    .or(`full_name.ilike.%${q}%,admission_no.ilike.%${q}%`)
    .order("full_name", { ascending: true })
    .limit(6);

  if (error || !students) return [];

  const classIds = [...new Set(students.map((s) => s.class_id).filter(Boolean))] as string[];
  const classNameById = new Map<string, string>();
  if (classIds.length > 0) {
    const { data: classes } = await supabase.from("classes").select("id, name").in("id", classIds);
    for (const c of classes ?? []) classNameById.set(c.id, c.name);
  }

  return students.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    admissionNo: s.admission_no,
    className: s.class_id ? (classNameById.get(s.class_id) ?? null) : null,
  }));
}
