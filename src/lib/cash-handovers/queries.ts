import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getCashBookEntries } from "@/lib/accounting/queries";

export async function getCashWithAccountantBalance(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<number> {
  const entries = await getCashBookEntries(supabase, schoolId, "1000");
  return entries.at(-1)?.runningBalance ?? 0;
}

export type CashHandoverRecord = {
  id: string;
  amount: number;
  note: string | null;
  receivedByName: string;
  createdAt: string;
};

export async function getCashHandoverHistory(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  limit = 5
): Promise<CashHandoverRecord[]> {
  const { data: handovers, error } = await supabase
    .from("cash_handovers")
    .select("id, amount, note, received_by, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !handovers) return [];

  const userIds = [...new Set(handovers.map((h) => h.received_by))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "Unknown"]));

  return handovers.map((h) => ({
    id: h.id,
    amount: h.amount,
    note: h.note,
    receivedByName: nameById.get(h.received_by) ?? "Unknown",
    createdAt: h.created_at,
  }));
}
