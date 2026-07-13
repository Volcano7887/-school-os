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
