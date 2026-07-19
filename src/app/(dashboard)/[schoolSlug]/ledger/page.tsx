import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getLedgerAccounts, getAccountLedger } from "@/lib/accounting/queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const TYPE_LABEL: Record<string, string> = {
  asset: "Asset",
  liability: "Liability",
  income: "Income",
  expense: "Expense",
  equity: "Equity",
};

export default async function LedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ accountId?: string }>;
}) {
  const { schoolSlug } = await params;
  const { accountId } = await searchParams;

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const accounts = await getLedgerAccounts(supabase, schoolId);
  const activeAccountId = accountId || accounts[0]?.id;
  const { entries, account } = activeAccountId
    ? await getAccountLedger(supabase, schoolId, activeAccountId)
    : { entries: [], account: null };

  const closingBalance = entries.at(-1)?.runningBalance ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Ledger</h1>
        {account && (
          <p className="text-sm text-muted-foreground">
            Closing balance: <span className="font-medium text-foreground">{inr(closingBalance)}</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {accounts.map((a) => (
          <Button
            key={a.id}
            asChild
            size="sm"
            variant={a.id === activeAccountId ? "default" : "outline"}
          >
            <a href={`?accountId=${a.id}`}>{a.name}</a>
          </Button>
        ))}
      </div>

      {!account ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No accounts set up yet.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {account.code} · {TYPE_LABEL[account.type]}
          </p>
          {entries.length === 0 ? (
            <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No transactions in this account yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Narration</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{formatDate(e.date)}</TableCell>
                      <TableCell>{e.narration ?? "—"}</TableCell>
                      <TableCell>{e.debit > 0 ? inr(e.debit) : ""}</TableCell>
                      <TableCell>{e.credit > 0 ? inr(e.credit) : ""}</TableCell>
                      <TableCell className="font-medium">{inr(e.runningBalance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
