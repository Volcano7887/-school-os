import { BellRing } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getStudentBalances } from "@/lib/fees/queries";
import { getClasses } from "@/lib/students/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FilterBar } from "@/components/shared/filter-bar";
import { SendReminderDropdown } from "../send-reminder-dropdown";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default async function FeesReminderPage({
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

  const withPhone = balances.filter((b) => b.balance > 0 && b.guardianPhone);
  const withoutPhone = balances.filter((b) => b.balance > 0 && !b.guardianPhone);

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Fees", href: `/${schoolSlug}/fees` },
          { label: "Fees Reminder" },
        ]}
      />
      <div>
        <h1 className="text-xl font-semibold">Fees Reminder</h1>
        <p className="text-sm text-muted-foreground">
          Send a WhatsApp reminder to guardians of students with dues — free,
          no account or API needed.
        </p>
      </div>

      <FilterBar classes={classes} search={q} classId={classId} />

      {withPhone.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <BellRing className="size-8 text-muted-foreground" />
          <p className="font-medium">No reminders to send</p>
          <p className="text-sm text-muted-foreground">
            Every student with dues either has no balance or no guardian phone
            number on file.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {withPhone.map((s) => (
            <div
              key={s.studentId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3"
            >
              <div>
                <p className="font-medium">{s.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {s.className ?? "No class"} · Due {inr(s.balance)}
                </p>
              </div>
              <SendReminderDropdown student={s} schoolName={school?.name ?? "School"} />
            </div>
          ))}
        </div>
      )}

      {withoutPhone.length > 0 && (
        <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          {withoutPhone.length} more {withoutPhone.length === 1 ? "student has" : "students have"}{" "}
          dues but no guardian phone number on file — add one on their profile
          to send a reminder.
        </div>
      )}
    </div>
  );
}
