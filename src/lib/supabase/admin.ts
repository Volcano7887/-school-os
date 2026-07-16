import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Service-role client — bypasses RLS entirely. Only ever call this from
// server actions that have already checked the caller's role themselves
// (e.g. is_school_admin), and only for the one thing anon/RLS genuinely
// can't do: creating another person's auth account (Members > Add Member).
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — required to add members. Add it to .env.local (and Vercel env vars) from Supabase Dashboard > Settings > API > service_role secret."
    );
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
