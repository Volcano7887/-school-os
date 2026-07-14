import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getTrialBalance } from "@/lib/accounting/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

const TYPE_LABEL: Record<string, string> = {
  asset: "Asset",
  liability: "Liability",
  income: "Income",
  expense: "Expense",
  equity: "Equity",
};

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const trialBalance = await getTrialBalance(supabase, schoolId);

  const totalIncome = trialBalance
    .filter((a) => a.type === "income")
    .reduce((sum, a) => sum + a.balance, 0);
  const totalExpense = trialBalance
    .filter((a) => a.type === "expense")
    .reduce((sum, a) => sum + a.balance, 0);
  const net = totalIncome - totalExpense;

  const totalDebits = trialBalance.reduce((sum, a) => sum + a.debitTotal, 0);
  const totalCredits = trialBalance.reduce((sum, a) => sum + a.creditTotal, 0);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Reports" },
        ]}
      />
      <h1 className="text-xl font-semibold">Reports</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Income vs Expense</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {inr(totalIncome)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expense
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {inr(totalExpense)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Net</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{inr(net)}</CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trial Balance</h2>
          <p className="text-xs text-muted-foreground">
            {totalDebits === totalCredits
              ? "Balanced ✓"
              : "⚠ Debits and credits don't match — this shouldn't happen"}
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Debit</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialBalance.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.code} — {a.name}
                  </TableCell>
                  <TableCell>{TYPE_LABEL[a.type]}</TableCell>
                  <TableCell>{a.debitTotal > 0 ? inr(a.debitTotal) : ""}</TableCell>
                  <TableCell>{a.creditTotal > 0 ? inr(a.creditTotal) : ""}</TableCell>
                  <TableCell>{inr(a.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
