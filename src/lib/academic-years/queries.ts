import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

export async function getCurrentAcademicYear(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<AcademicYear | null> {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, name, start_date, end_date, is_current")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    isCurrent: data.is_current,
  };
}
