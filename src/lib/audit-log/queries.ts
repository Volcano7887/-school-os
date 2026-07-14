import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditAction, Database } from "@/types/database.types";

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  tableName: string;
  recordId: string;
  userName: string;
  createdAt: string;
};

const TABLE_LABEL: Record<string, string> = {
  fee_payments: "Fee Payment",
  expenses: "Expense",
  salary_payments: "Salary Payment",
};

export async function getAuditLog(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, table_name, record_id, user_id, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  const userIds = [...new Set(data.map((row) => row.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return data.map((row) => ({
    id: row.id,
    action: row.action,
    tableName: TABLE_LABEL[row.table_name] ?? row.table_name,
    recordId: row.record_id,
    userName: nameById.get(row.user_id) ?? "Unknown",
    createdAt: row.created_at,
  }));
}
