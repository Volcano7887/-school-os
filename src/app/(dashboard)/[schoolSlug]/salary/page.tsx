import { UserPlus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getStaffWithCurrentMonthStatus } from "@/lib/salary/queries";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddStaffDialog } from "./add-staff-dialog";
import { PaySalaryDialog } from "./pay-salary-dialog";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function StatusBadge({ paid }: { paid: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        paid
          ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
      }`}
    >
      {paid ? "Paid" : "Pending"}
    </span>
  );
}

export default async function SalaryPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const staff = await getStaffWithCurrentMonthStatus(supabase, schoolId);
  const monthName = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Salary</h1>
          <p className="text-sm text-muted-foreground">{monthName}</p>
        </div>
        <AddStaffDialog
          schoolSlug={schoolSlug}
          trigger={
            <Button size="sm">
              <UserPlus className="size-4" />
              Add Staff
            </Button>
          }
        />
      </div>

      {staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <Users className="size-8 text-muted-foreground" />
          <p className="font-medium">No staff yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first staff member to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Monthly Salary</TableHead>
                  <TableHead>This Month</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.fullName}</TableCell>
                    <TableCell>{s.designation ?? "—"}</TableCell>
                    <TableCell>{inr(s.monthlySalary)}</TableCell>
                    <TableCell>
                      <StatusBadge paid={s.paidThisMonth} />
                    </TableCell>
                    <TableCell>
                      <PaySalaryDialog
                        schoolSlug={schoolSlug}
                        staff={s}
                        trigger={
                          <Button size="sm" variant="outline" disabled={s.paidThisMonth}>
                            {s.paidThisMonth ? "Paid" : "Pay Salary"}
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 sm:hidden">
            {staff.map((s) => (
              <div key={s.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.fullName}</span>
                  <StatusBadge paid={s.paidThisMonth} />
                </div>
                <div className="mt-1 flex justify-between text-sm text-muted-foreground">
                  <span>{s.designation ?? "No designation"}</span>
                  <span>{inr(s.monthlySalary)}</span>
                </div>
                <PaySalaryDialog
                  schoolSlug={schoolSlug}
                  staff={s}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      disabled={s.paidThisMonth}
                    >
                      {s.paidThisMonth ? "Paid" : "Pay Salary"}
                    </Button>
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
