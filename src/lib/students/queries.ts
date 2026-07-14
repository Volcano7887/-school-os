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
  dueAmount: number;
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
  filters: { search?: string; classId?: string; status?: "due" | "clear" },
  academicYearId: string | null
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

  // Due amount, computed the same way as Fee Collection: sum of applicable
  // fee_structures for the student's class minus what they've paid, for
  // the current academic year (0 if no academic year exists yet).
  const dueByStudentId = new Map<string, number>();
  if (academicYearId) {
    const [{ data: structures }, { data: payments }] = await Promise.all([
      supabase
        .from("fee_structures")
        .select("class_id, amount")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId)
        .eq("is_active", true),
      supabase
        .from("fee_payments")
        .select("student_id, amount")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId),
    ]);

    const paidByStudent = new Map<string, number>();
    for (const p of payments ?? []) {
      paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + p.amount);
    }

    for (const s of students) {
      const totalDue = (structures ?? [])
        .filter((fs) => fs.class_id === null || fs.class_id === s.class_id)
        .reduce((sum, fs) => sum + fs.amount, 0);
      const totalPaid = paidByStudent.get(s.id) ?? 0;
      dueByStudentId.set(s.id, Math.max(totalDue - totalPaid, 0));
    }
  }

  let result = students.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    admissionNo: s.admission_no,
    className: s.class_id ? (classNameById.get(s.class_id) ?? null) : null,
    isActive: s.is_active,
    dueAmount: dueByStudentId.get(s.id) ?? 0,
  }));

  if (filters.status === "due") result = result.filter((s) => s.dueAmount > 0);
  if (filters.status === "clear") result = result.filter((s) => s.dueAmount === 0);

  return result;
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
