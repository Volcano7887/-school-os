import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getClasses } from "@/lib/students/queries";
import { getFeeStructures, getStudentBalances, searchFeePayments } from "@/lib/fees/queries";
import { AcademicYearSetup } from "./academic-year-setup";
import { FeeStructureDialog } from "./fee-structure-dialog";
import { FeeCollectionWorkspace } from "./fee-collection-workspace";
import { FeesTabs } from "./fees-tabs";
import { DueList } from "./due-list";
import { PaymentHistory } from "./payment-history";

// Fees Collection used to be 8 nav destinations (Collect, Search Payments,
// Search Due, Quick Fees, Types, Discounts, Carry Forward, Reminders) for
// what's fundamentally one workspace. Collect/Due/History — the three that
// were genuinely "find a student, do something with a payment" — are now
// one page with a segmented view. Types/Discounts/Carry Forward/Reminders
// stay as their own pages for now (different job: reference data and bulk
// actions, not the collect-a-payment flow).
type FeesView = "collect" | "due" | "history";

export default async function FeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{
    q?: string;
    classId?: string;
    view?: string;
    mode?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { schoolSlug } = await params;
  const sp = await searchParams;
  const q = sp.q ?? "";
  const classId = sp.classId ?? "";
  const view: FeesView = sp.view === "due" || sp.view === "history" ? sp.view : "collect";

  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const academicYear = await getCurrentAcademicYear(supabase, schoolId);

  if (!academicYear) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Fees</h1>
        <AcademicYearSetup schoolSlug={schoolSlug} />
      </div>
    );
  }

  const [classes, structures, balances, school, historyResults] = await Promise.all([
    getClasses(supabase, schoolId),
    getFeeStructures(supabase, schoolId, academicYear.id),
    getStudentBalances(supabase, schoolId, academicYear.id, { search: q, classId }),
    getSchoolProfile(supabase, schoolId),
    view === "history"
      ? searchFeePayments(supabase, schoolId, {
          search: q,
          paymentMode: sp.mode ?? "",
          fromDate: sp.from ?? "",
          toDate: sp.to ?? "",
        })
      : Promise.resolve([]),
  ]);
  const schoolName = school?.name ?? "School";
  const dueStudents = balances
    .filter((b) => b.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Fees</h1>
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

      <FeesTabs schoolSlug={schoolSlug} active={view} dueCount={dueStudents.length} />

      {view === "collect" && (
        <FeeCollectionWorkspace
          schoolSlug={schoolSlug}
          schoolName={schoolName}
          students={balances}
          classes={classes}
          search={q}
          classId={classId}
        />
      )}
      {view === "due" && (
        <DueList
          schoolSlug={schoolSlug}
          schoolName={schoolName}
          students={dueStudents}
          classes={classes}
          search={q}
          classId={classId}
        />
      )}
      {view === "history" && (
        <PaymentHistory
          schoolSlug={schoolSlug}
          results={historyResults}
          q={q}
          mode={sp.mode ?? ""}
          from={sp.from ?? ""}
          to={sp.to ?? ""}
        />
      )}
    </div>
  );
}
