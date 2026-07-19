import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getDiscountedPayments } from "@/lib/fees/queries";
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

export default async function FeesDiscountPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const academicYear = await getCurrentAcademicYear(supabase, schoolId);
  const payments = academicYear
    ? await getDiscountedPayments(supabase, schoolId, academicYear.id)
    : [];

  const total = payments.reduce((sum, p) => sum + p.discountAmount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Fees Discount</h1>
          <p className="text-sm text-muted-foreground">
            {academicYear ? `Academic year ${academicYear.name}` : "No academic year set up yet"}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-2 text-right">
          <p className="text-xs text-muted-foreground">Total Discounts Given</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            {inr(total)}
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No discounts given yet this academic year.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDate(p.paidAt)}</TableCell>
                  <TableCell className="font-medium">{p.receiptNo}</TableCell>
                  <TableCell>{p.studentName}</TableCell>
                  <TableCell className="text-green-600 dark:text-green-400">
                    -{inr(p.discountAmount)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/${schoolSlug}/fees/receipts/${p.id}`}
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
