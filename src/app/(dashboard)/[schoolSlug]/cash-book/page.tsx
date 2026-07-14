import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getCashBookEntries, type CashBookEntry } from "@/lib/accounting/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CashBookTable({ entries }: { entries: CashBookEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No transactions yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Narration</TableHead>
            <TableHead>In</TableHead>
            <TableHead>Out</TableHead>
            <TableHead>Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{formatDate(e.date)}</TableCell>
              <TableCell>{e.narration ?? "—"}</TableCell>
              <TableCell className="text-green-600 dark:text-green-400">
                {e.debit > 0 ? inr(e.debit) : ""}
              </TableCell>
              <TableCell className="text-red-600 dark:text-red-400">
                {e.credit > 0 ? inr(e.credit) : ""}
              </TableCell>
              <TableCell className="font-medium">{inr(e.runningBalance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function CashBookPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const [cashEntries, bankEntries] = await Promise.all([
    getCashBookEntries(supabase, schoolId, "1000"),
    getCashBookEntries(supabase, schoolId, "1010"),
  ]);

  const cashBalance = cashEntries.at(-1)?.runningBalance ?? 0;
  const bankBalance = bankEntries.at(-1)?.runningBalance ?? 0;

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Cash Book" },
        ]}
      />
      <h1 className="text-xl font-semibold">Cash Book</h1>

      <Tabs defaultValue="cash">
        <TabsList>
          <TabsTrigger value="cash">Cash in Hand — {inr(cashBalance)}</TabsTrigger>
          <TabsTrigger value="bank">Bank Account — {inr(bankBalance)}</TabsTrigger>
        </TabsList>
        <TabsContent value="cash" className="mt-4">
          <CashBookTable entries={cashEntries} />
        </TabsContent>
        <TabsContent value="bank" className="mt-4">
          <CashBookTable entries={bankEntries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
