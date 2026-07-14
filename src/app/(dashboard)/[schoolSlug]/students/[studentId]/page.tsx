import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getClasses, getStudent } from "@/lib/students/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getStudentPayments, getStudentBalances } from "@/lib/fees/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentFormDialog } from "../student-form-dialog";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

const PAYMENT_MODE_LABEL: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  upi: "UPI",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const GENDER_LABEL: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ schoolSlug: string; studentId: string }>;
}) {
  const { schoolSlug, studentId } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const [student, classes, academicYear] = await Promise.all([
    getStudent(supabase, schoolId, studentId),
    getClasses(supabase, schoolId),
    getCurrentAcademicYear(supabase, schoolId),
  ]);

  if (!student) notFound();

  const className = classes.find((c) => c.id === student.class_id)?.name;
  const [payments, balances] = await Promise.all([
    academicYear ? getStudentPayments(supabase, schoolId, studentId, academicYear.id) : [],
    academicYear ? getStudentBalances(supabase, schoolId, academicYear.id, {}) : [],
  ]);
  const balance = balances.find((b) => b.studentId === studentId);

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Students", href: `/${schoolSlug}/students` },
          { label: student.full_name },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback>{initials(student.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{student.full_name}</h1>
              {student.is_active ? (
                <Badge variant="secondary">Active</Badge>
              ) : (
                <Badge variant="outline">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {className ?? "No class"}
              {student.admission_no && ` · Admission No. ${student.admission_no}`}
            </p>
          </div>
        </div>
        <StudentFormDialog
          schoolSlug={schoolSlug}
          classes={classes}
          student={student}
          trigger={
            <Button size="sm" variant="outline">
              <Pencil className="size-4" />
              Edit
            </Button>
          }
        />
      </div>

      {balance && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {inr(balance.totalPaid)}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total Due</p>
            <p className="text-lg font-semibold">{inr(balance.totalDue)}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">
              {balance.balance < 0 ? "Advance" : "Balance"}
            </p>
            <p
              className={`text-lg font-semibold ${balance.balance > 0 ? "text-destructive" : ""}`}
            >
              {inr(Math.abs(balance.balance))}
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="details">Profile Details</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          {!academicYear ? (
            <p className="text-sm text-muted-foreground">
              No academic year set up yet — visit Fee Collection first.
            </p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payments recorded yet for {academicYear.name}.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.paidAt)}</TableCell>
                      <TableCell className="font-medium">{p.receiptNo}</TableCell>
                      <TableCell>{inr(p.amount)}</TableCell>
                      <TableCell>{PAYMENT_MODE_LABEL[p.paymentMode]}</TableCell>
                      <TableCell>{p.remarks ?? p.periodLabel ?? "—"}</TableCell>
                      <TableCell>
                        <Link
                          href={`/${schoolSlug}/fees/receipts/${p.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Receipt
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <div className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="text-sm">
                {student.gender ? GENDER_LABEL[student.gender] : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date of birth</p>
              <p className="text-sm">{formatDate(student.dob)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admission date</p>
              <p className="text-sm">{formatDate(student.admission_date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="text-sm">{student.address ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Guardian name</p>
              <p className="text-sm">{student.guardian_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Guardian phone</p>
              <p className="text-sm">{student.guardian_phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Guardian email</p>
              <p className="text-sm">{student.guardian_email ?? "—"}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
