import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getStudentBalances } from "@/lib/fees/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { AcademicYearSetup } from "../academic-year-setup";
import { QuickFeesWorkspace } from "./quick-fees-workspace";

export default async function QuickFeesPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
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
            { label: "Fee Collection", href: `/${schoolSlug}/fees` },
            { label: "Quick Fees" },
          ]}
        />
        <h1 className="text-xl font-semibold">Quick Fees</h1>
        <AcademicYearSetup schoolSlug={schoolSlug} />
      </div>
    );
  }

  const students = await getStudentBalances(supabase, schoolId, academicYear.id, {});

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Fee Collection", href: `/${schoolSlug}/fees` },
          { label: "Quick Fees" },
        ]}
      />
      <h1 className="text-xl font-semibold">Quick Fees</h1>
      <QuickFeesWorkspace schoolSlug={schoolSlug} students={students} />
    </div>
  );
}
