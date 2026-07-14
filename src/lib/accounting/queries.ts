import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountType, Database } from "@/types/database.types";

export type LedgerAccountOption = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
};

export async function getLedgerAccounts(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<LedgerAccountOption[]> {
  const { data, error } = await supabase
    .from("ledger_accounts")
    .select("id, code, name, type")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("code", { ascending: true });

  if (error || !data) return [];
  return data;
}

// Debit-normal accounts (asset, expense) increase with a debit; credit-normal
// accounts (liability, income, equity) increase with a credit. Running
// balance must respect this or a "Cash in Hand" ledger would show a
// decreasing balance every time money came in.
function isDebitNormal(type: AccountType) {
  return type === "asset" || type === "expense";
}

export type LedgerEntry = {
  id: string;
  date: string;
  narration: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
};

export async function getAccountLedger(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  accountId: string
): Promise<{ entries: LedgerEntry[]; account: LedgerAccountOption | null }> {
  const { data: account } = await supabase
    .from("ledger_accounts")
    .select("id, code, name, type")
    .eq("id", accountId)
    .eq("school_id", schoolId)
    .single();

  if (!account) return { entries: [], account: null };

  const { data: lines, error } = await supabase
    .from("journal_entry_lines")
    .select("id, debit_amount, credit_amount, journal_entry_id")
    .eq("ledger_account_id", accountId);

  if (error || !lines || lines.length === 0) return { entries: [], account };

  const entryIds = lines.map((l) => l.journal_entry_id);
  const { data: journalEntries } = await supabase
    .from("journal_entries")
    .select("id, entry_date, narration")
    .in("id", entryIds)
    .eq("school_id", schoolId);

  const entryById = new Map((journalEntries ?? []).map((e) => [e.id, e]));
  const debitNormal = isDebitNormal(account.type);

  const rows = lines
    .map((line) => {
      const je = entryById.get(line.journal_entry_id);
      if (!je) return null;
      return {
        id: line.id,
        date: je.entry_date,
        narration: je.narration,
        debit: line.debit_amount,
        credit: line.credit_amount,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;
  const entries: LedgerEntry[] = rows.map((r) => {
    running += debitNormal ? r.debit - r.credit : r.credit - r.debit;
    return { ...r, runningBalance: running };
  });

  return { entries, account };
}

export type CashBookEntry = LedgerEntry & { type: "in" | "out" };

export async function getCashBookEntries(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  accountCode: "1000" | "1010"
): Promise<CashBookEntry[]> {
  const { data: account } = await supabase
    .from("ledger_accounts")
    .select("id")
    .eq("school_id", schoolId)
    .eq("code", accountCode)
    .single();

  if (!account) return [];

  const { entries } = await getAccountLedger(supabase, schoolId, account.id);
  return entries.map((e) => ({ ...e, type: e.debit > 0 ? "in" : "out" }));
}
