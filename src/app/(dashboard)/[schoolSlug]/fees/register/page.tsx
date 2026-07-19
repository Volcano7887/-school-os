import { Fragment } from "react";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getClasses } from "@/lib/students/queries";
import { getFeeRegister, REGISTER_CATEGORIES } from "@/lib/fees/register";
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
import { RegisterImportButton } from "./register-import-button";

function inr(paise: number | null) {
  if (paise === null) return "";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "numeric", year: "2-digit" });
}

export default async function FeeRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ q?: string; classId?: string }>;
}) {
  const { schoolSlug } = await params;
  const sp = await searchParams;
  const q = sp.q ?? "";
  const classId = sp.classId ?? "";

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const academicYear = await getCurrentAcademicYear(supabase, schoolId);
  if (!academicYear) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Fee Register</h1>
        <p className="text-sm text-muted-foreground">
          Set up an academic year first (via Fees) before viewing the register.
        </p>
      </div>
    );
  }

  const [classes, rows] = await Promise.all([
    getClasses(supabase, schoolId),
    getFeeRegister(supabase, schoolId, academicYear.id, { classId: classId || undefined }),
  ]);

  const filteredRows = q
    ? rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
    : rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Fee Register</h1>
          <p className="text-sm text-muted-foreground">
            Academic year {academicYear.name} — same layout as your Excel fee records.
          </p>
        </div>
        <div className="flex gap-2">
          <RegisterImportButton schoolSlug={schoolSlug} />
          <Button asChild variant="outline">
            <a href={`/api/fees/register/export?schoolSlug=${schoolSlug}&classId=${classId}`}>
              <Download className="size-4" />
              Export to Excel
            </a>
          </Button>
        </div>
      </div>

      <FilterBar classes={classes} search={q} classId={classId} />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="sticky left-0 bg-card">SR NO</TableHead>
              <TableHead rowSpan={2} className="sticky left-10 bg-card">NAME</TableHead>
              <TableHead rowSpan={2}>CLASS</TableHead>
              {REGISTER_CATEGORIES.map((c) => (
                <TableHead key={c} colSpan={2} className="text-center">
                  {c}
                </TableHead>
              ))}
              <TableHead rowSpan={2}>TOTAL FEES</TableHead>
              <TableHead rowSpan={2}>PAID</TableHead>
              <TableHead rowSpan={2}>BALANCE</TableHead>
            </TableRow>
            <TableRow>
              {REGISTER_CATEGORIES.map((c) => (
                <Fragment key={c}>
                  <TableHead className="text-xs text-muted-foreground">Amt</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.studentId}>
                <TableCell className="sticky left-0 bg-card">{row.srNo}</TableCell>
                <TableCell className="sticky left-10 bg-card font-medium whitespace-nowrap">
                  {row.name}
                </TableCell>
                <TableCell>{row.className ?? "—"}</TableCell>
                {REGISTER_CATEGORIES.map((c) => (
                  <Fragment key={c}>
                    <TableCell className="whitespace-nowrap">{inr(row.cells[c].amount)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(row.cells[c].date)}
                    </TableCell>
                  </Fragment>
                ))}
                <TableCell className="font-medium whitespace-nowrap">{inr(row.totalFees)}</TableCell>
                <TableCell className="whitespace-nowrap">{inr(row.paid)}</TableCell>
                <TableCell className="font-medium whitespace-nowrap text-destructive">
                  {inr(row.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
