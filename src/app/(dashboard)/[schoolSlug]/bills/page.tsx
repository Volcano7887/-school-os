import { Paperclip, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getExpenseBills } from "@/lib/expenses/queries";
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

export default async function BillsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const bills = await getExpenseBills(supabase, schoolId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Bills</h1>
        <p className="text-sm text-muted-foreground">
          Every expense with an uploaded bill or invoice.
        </p>
      </div>

      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <Paperclip className="size-8 text-muted-foreground" />
          <p className="font-medium">No bills uploaded yet</p>
          <p className="text-sm text-muted-foreground">
            Attach a bill when recording an expense and it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bill No.</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{formatDate(b.expenseDate)}</TableCell>
                  <TableCell className="font-medium">{b.categoryName}</TableCell>
                  <TableCell>{b.vendorName ?? "—"}</TableCell>
                  <TableCell>{inr(b.amount)}</TableCell>
                  <TableCell>{b.billNo ?? "—"}</TableCell>
                  <TableCell>
                    {b.signedUrl && (
                      <a
                        href={b.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View <ExternalLink className="size-3.5" />
                      </a>
                    )}
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
