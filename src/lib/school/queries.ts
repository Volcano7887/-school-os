import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SchoolRole } from "@/types/database.types";

export type UserSchool = {
  id: string;
  name: string;
  slug: string;
  role: SchoolRole;
};

// Two plain queries instead of an embedded `schools!inner(...)` select —
// our hand-written database.types.ts has no Relationships metadata (real
// codegen is blocked until Docker/Podman is available), so a joined select
// wouldn't type-check reliably against it.
export async function getUserSchools(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserSchool[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("school_users")
    .select("school_id, role")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (membershipError || !memberships || memberships.length === 0) return [];

  const schoolIds = memberships.map((m) => m.school_id);
  const { data: schools, error: schoolsError } = await supabase
    .from("schools")
    .select("id, name, slug, created_at")
    .in("id", schoolIds)
    .order("created_at", { ascending: true });

  if (schoolsError || !schools) return [];

  const roleBySchoolId = new Map(memberships.map((m) => [m.school_id, m.role]));

  return schools.map((school) => ({
    id: school.id,
    name: school.name,
    slug: school.slug,
    role: roleBySchoolId.get(school.id)!,
  }));
}

// RLS (schools_select: is_school_member OR created_by = auth.uid()) does the
// authorization here — this simply returns null if the caller isn't
// permitted to see the school, same as if it didn't exist.
export async function getSchoolIdBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("schools")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data.id;
}

export type SchoolProfile = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  academicYearStartMonth: number;
};

export async function getSchoolProfile(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<SchoolProfile | null> {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, address, phone, email, academic_year_start_month")
    .eq("id", schoolId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    phone: data.phone,
    email: data.email,
    academicYearStartMonth: data.academic_year_start_month,
  };
}
