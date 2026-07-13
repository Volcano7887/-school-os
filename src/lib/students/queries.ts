import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type SchoolClass = {
  id: string;
  name: string;
};

export type StudentListItem = {
  id: string;
  fullName: string;
  admissionNo: string | null;
  className: string | null;
  isActive: boolean;
};

export async function getClasses(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<SchoolClass[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("id, name")
    .eq("school_id", schoolId)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getStudents(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  filters: { search?: string; classId?: string }
): Promise<StudentListItem[]> {
  let query = supabase
    .from("students")
    .select("id, full_name, admission_no, class_id, is_active")
    .eq("school_id", schoolId)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (filters.search) {
    query = query.ilike("full_name", `%${filters.search}%`);
  }
  if (filters.classId) {
    query = query.eq("class_id", filters.classId);
  }

  const { data: students, error } = await query;
  if (error || !students) return [];

  const classes = await getClasses(supabase, schoolId);
  const classNameById = new Map(classes.map((c) => [c.id, c.name]));

  return students.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    admissionNo: s.admission_no,
    className: s.class_id ? (classNameById.get(s.class_id) ?? null) : null,
    isActive: s.is_active,
  }));
}

export async function getStudent(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  studentId: string
) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("school_id", schoolId)
    .eq("id", studentId)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;
  return data;
}
