import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { searchFeePayments } from "@/lib/fees/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAYMENT_MODE_LABEL: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  upi: "UPI",
};

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

export default async function SearchFeesPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{
    q?: string;
    mode?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { schoolSlug } = await params;
  const { q = "", mode = "", from = "", to = "" } = await searchParams;

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const results = await searchFeePayments(supabase, schoolId, {
    search: q,
    paymentMode: mode,
    fromDate: from,
    toDate: to,
  });

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Fee Collection", href: `/${schoolSlug}/fees` },
          { label: "Search Fees Payment" },
        ]}
      />
      <div>
        <h1 className="text-xl font-semibold">Search Fees Payment</h1>
        <p className="text-sm text-muted-foreground">
          Look up any payment across the school by student, receipt number,
          date range, or payment mode.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Student name or receipt no…"
          className="max-w-xs"
        />
        <Select name="mode" defaultValue={mode || "all"}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modes</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
          </SelectContent>
        </Select>
        <Input name="from" type="date" defaultValue={from} className="w-40" />
        <Input name="to" type="date" defaultValue={to} className="w-40" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {results.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No payments match your search.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDate(r.paidAt)}</TableCell>
                  <TableCell className="font-medium">{r.receiptNo}</TableCell>
                  <TableCell>{r.studentName}</TableCell>
                  <TableCell>{r.className ?? "—"}</TableCell>
                  <TableCell>{inr(r.amount)}</TableCell>
                  <TableCell>{PAYMENT_MODE_LABEL[r.paymentMode] ?? r.paymentMode}</TableCell>
                  <TableCell>
                    <Link
                      href={`/${schoolSlug}/fees/receipts/${r.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Receipt
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
