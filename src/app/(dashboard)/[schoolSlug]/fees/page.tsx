import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getClasses } from "@/lib/students/queries";
import { getFeeStructures, getStudentBalances } from "@/lib/fees/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FilterBar } from "@/components/shared/filter-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AcademicYearSetup } from "./academic-year-setup";
import { FeeStructureDialog } from "./fee-structure-dialog";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { SendReminderDropdown } from "./send-reminder-dropdown";
import { Button } from "@/components/ui/button";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

// A negative balance means the student has paid more than what's currently
// due (often because payments were recorded before a fee structure existed)
// — showing that as a plain negative number reads like an error, so we
// label it as an advance/credit instead.
function formatBalance(balance: number) {
  if (balance < 0) return `${inr(Math.abs(balance))} advance`;
  return inr(balance);
}

function statusFor(totalDue: number, totalPaid: number, balance: number) {
  if (balance < 0)
    return {
      label: "Advance",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    };
  if (totalDue === 0) return { label: "No dues", className: "bg-muted text-muted-foreground" };
  if (balance === 0)
    return {
      label: "Paid",
      className: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    };
  if (totalPaid > 0)
    return {
      label: "Partial",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    };
  return { label: "Pending", className: "bg-muted text-muted-foreground" };
}

export default async function FeesPage({
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

  if (!academicYear) {
    return (
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
            { label: "Fee Collection" },
          ]}
        />
        <h1 className="text-xl font-semibold">Fee Collection</h1>
        <AcademicYearSetup schoolSlug={schoolSlug} />
      </div>
    );
  }

  const [classes, structures, balances, school] = await Promise.all([
    getClasses(supabase, schoolId),
    getFeeStructures(supabase, schoolId, academicYear.id),
    getStudentBalances(supabase, schoolId, academicYear.id, { search: q, classId }),
    getSchoolProfile(supabase, schoolId),
  ]);
  const schoolName = school?.name ?? "School";

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Fee Collection" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Fee Collection</h1>
          <p className="text-sm text-muted-foreground">Academic year {academicYear.name}</p>
        </div>
        <FeeStructureDialog schoolSlug={schoolSlug} structures={structures} classes={classes} />
      </div>

      {structures.length === 0 && (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          No fee structures set up yet for this academic year — dues will show
          as ₹0 until you add some via &quot;Fee structures&quot; above.
        </p>
      )}

      <FilterBar classes={classes} search={q} classId={classId} />

      {balances.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <Wallet className="size-8 text-muted-foreground" />
          <p className="font-medium">
            {q || classId ? "No students match your search" : "No students yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {q || classId
              ? "Try a different name or clear the class filter."
              : "Add students first, then come back here to collect fees."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Total Due</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((s) => {
                  const status = statusFor(s.totalDue, s.totalPaid, s.balance);
                  return (
                    <TableRow key={s.studentId}>
                      <TableCell className="font-medium">{s.fullName}</TableCell>
                      <TableCell>{s.className ?? "—"}</TableCell>
                      <TableCell>{inr(s.totalDue)}</TableCell>
                      <TableCell>{inr(s.totalPaid)}</TableCell>
                      <TableCell>{formatBalance(s.balance)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {s.balance > 0 && (
                            <SendReminderDropdown student={s} schoolName={schoolName} />
                          )}
                          <RecordPaymentDialog
                            schoolSlug={schoolSlug}
                            student={s}
                            trigger={
                              <Button size="sm" variant="outline">
                                Record payment
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 sm:hidden">
            {balances.map((s) => {
              const status = statusFor(s.totalDue, s.totalPaid, s.balance);
              return (
                <div key={s.studentId} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.fullName}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm text-muted-foreground">
                    <span>{s.className ?? "No class"}</span>
                    <span>
                      {inr(s.totalPaid)} / {inr(s.totalDue)}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {s.balance > 0 && (
                      <SendReminderDropdown student={s} schoolName={schoolName} />
                    )}
                    <RecordPaymentDialog
                      schoolSlug={schoolSlug}
                      student={s}
                      trigger={
                        <Button size="sm" variant="outline" className="flex-1">
                          Record payment
                        </Button>
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
