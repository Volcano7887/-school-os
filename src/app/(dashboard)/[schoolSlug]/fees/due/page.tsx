import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getStudentBalances } from "@/lib/fees/queries";
import { getClasses } from "@/lib/students/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FilterBar } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SendReminderDropdown } from "../send-reminder-dropdown";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default async function SearchDueFeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ q?: string; classId?: string }>;
}) {
  const { schoolSlug } = await params;
  const { q = "", classId = "" } = await searchParams;

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const academicYear = await getCurrentAcademicYear(supabase, schoolId);
  const [classes, balances, school] = await Promise.all([
    getClasses(supabase, schoolId),
    academicYear
      ? getStudentBalances(supabase, schoolId, academicYear.id, { search: q, classId })
      : Promise.resolve([]),
    getSchoolProfile(supabase, schoolId),
  ]);

  const due = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const totalDue = due.reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Fee Collection", href: `/${schoolSlug}/fees` },
          { label: "Search Due Fees" },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Search Due Fees</h1>
          <p className="text-sm text-muted-foreground">
            {due.length} {due.length === 1 ? "student" : "students"} with dues
          </p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-2 text-right">
          <p className="text-xs text-muted-foreground">Total Outstanding</p>
          <p className="text-lg font-semibold text-destructive">{inr(totalDue)}</p>
        </div>
      </div>

      <FilterBar classes={classes} search={q} classId={classId} />

      {due.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <AlertCircle className="size-8 text-muted-foreground" />
          <p className="font-medium">No outstanding dues</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Total Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {due.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell className="font-medium">{s.fullName}</TableCell>
                  <TableCell>{s.className ?? "—"}</TableCell>
                  <TableCell>{inr(s.totalDue)}</TableCell>
                  <TableCell>{inr(s.totalPaid)}</TableCell>
                  <TableCell className="text-destructive">{inr(s.balance)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <SendReminderDropdown student={s} schoolName={school?.name ?? "School"} />
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/${schoolSlug}/fees?q=${encodeURIComponent(s.fullName)}`}>
                          Collect
                        </Link>
                      </Button>
                    </div>
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
