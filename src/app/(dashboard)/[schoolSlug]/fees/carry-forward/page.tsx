import { CornerDownRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getCurrentAcademicYear, getPreviousAcademicYear } from "@/lib/academic-years/queries";
import { getCarryForwardCandidates } from "@/lib/fees/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CarryForwardButton } from "./carry-forward-button";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default async function FeesCarryForwardPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const currentYear = await getCurrentAcademicYear(supabase, schoolId);

  if (!currentYear) {
    return (
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
            { label: "Fees", href: `/${schoolSlug}/fees` },
            { label: "Fees Carry Forward" },
          ]}
        />
        <h1 className="text-xl font-semibold">Fees Carry Forward</h1>
        <p className="text-sm text-muted-foreground">
          Set up an academic year first (via Fee Collection) before carrying
          forward balances.
        </p>
      </div>
    );
  }

  const previousYear = await getPreviousAcademicYear(supabase, schoolId, currentYear.startDate);

  const candidates = previousYear
    ? await getCarryForwardCandidates(supabase, schoolId, previousYear.id, currentYear.id)
    : [];

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Fees", href: `/${schoolSlug}/fees` },
          { label: "Fees Carry Forward" },
        ]}
      />
      <div>
        <h1 className="text-xl font-semibold">Fees Carry Forward</h1>
        <p className="text-sm text-muted-foreground">
          {previousYear
            ? `Move a student's unpaid balance from ${previousYear.name} into ${currentYear.name} as arrears.`
            : "No previous academic year found yet — this shows up once there's a year before your current one."}
        </p>
      </div>

      {!previousYear ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <CornerDownRight className="size-8 text-muted-foreground" />
          <p className="font-medium">Nothing to carry forward yet</p>
        </div>
      ) : candidates.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No outstanding balances in {previousYear.name}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Balance ({previousYear.name})</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => (
                <TableRow key={c.studentId}>
                  <TableCell className="font-medium">{c.fullName}</TableCell>
                  <TableCell>{c.className ?? "—"}</TableCell>
                  <TableCell className="text-destructive">{inr(c.balance)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <CarryForwardButton
                        schoolSlug={schoolSlug}
                        studentId={c.studentId}
                        amount={c.balance}
                        sourceAcademicYearId={previousYear.id}
                        targetAcademicYearId={currentYear.id}
                        alreadyCarried={c.alreadyCarried}
                      />
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
