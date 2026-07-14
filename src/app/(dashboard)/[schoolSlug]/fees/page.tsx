import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getClasses } from "@/lib/students/queries";
import { getFeeStructures, getStudentBalances } from "@/lib/fees/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { AcademicYearSetup } from "./academic-year-setup";
import { FeeStructureDialog } from "./fee-structure-dialog";
import { FeeCollectionWorkspace } from "./fee-collection-workspace";

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

      <FeeCollectionWorkspace
        schoolSlug={schoolSlug}
        schoolName={schoolName}
        students={balances}
        classes={classes}
        search={q}
        classId={classId}
      />
    </div>
  );
}
