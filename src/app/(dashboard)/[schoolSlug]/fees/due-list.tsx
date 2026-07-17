import Link from "next/link";
import { AlertCircle } from "lucide-react";
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
import { SendReminderDropdown } from "./send-reminder-dropdown";
import type { StudentBalance } from "@/lib/fees/queries";
import type { SchoolClass } from "@/lib/students/queries";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function DueList({
  schoolSlug,
  schoolName,
  students,
  classes,
  search,
  classId,
}: {
  schoolSlug: string;
  schoolName: string;
  students: StudentBalance[];
  classes: SchoolClass[];
  search: string;
  classId: string;
}) {
  const totalDue = students.reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {students.length} {students.length === 1 ? "student" : "students"} with dues
        </p>
        <div className="rounded-lg border bg-card px-4 py-2 text-right">
          <p className="text-xs text-muted-foreground">Total Outstanding</p>
          <p className="text-lg font-semibold text-destructive">{inr(totalDue)}</p>
        </div>
      </div>

      <FilterBar classes={classes} search={search} classId={classId} />

      {students.length === 0 ? (
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
              {students.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell className="font-medium">{s.fullName}</TableCell>
                  <TableCell>{s.className ?? "—"}</TableCell>
                  <TableCell>{inr(s.totalDue)}</TableCell>
                  <TableCell>{inr(s.totalPaid)}</TableCell>
                  <TableCell className="text-destructive">{inr(s.balance)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <SendReminderDropdown student={s} schoolName={schoolName} />
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
