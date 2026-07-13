import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getClasses, getStudents } from "@/lib/students/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentFormDialog } from "./student-form-dialog";
import { ManageClassesDialog } from "./manage-classes-dialog";
import { FilterBar } from "@/components/shared/filter-bar";

export default async function StudentsPage({
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

  const [classes, students] = await Promise.all([
    getClasses(supabase, schoolId),
    getStudents(supabase, schoolId, { search: q, classId }),
  ]);

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Students" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground">
            {students.length} student{students.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <ManageClassesDialog schoolSlug={schoolSlug} classes={classes} />
          <StudentFormDialog
            schoolSlug={schoolSlug}
            classes={classes}
            trigger={
              <Button size="sm">
                <UserPlus className="size-4" />
                Add Student
              </Button>
            }
          />
        </div>
      </div>

      <FilterBar classes={classes} search={q} classId={classId} />

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <Users className="size-8 text-muted-foreground" />
          <p className="font-medium">
            {q || classId ? "No students match your search" : "No students yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {q || classId
              ? "Try a different name or clear the class filter."
              : "Add your first student to get started."}
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
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/${schoolSlug}/students/${s.id}`}
                        className="hover:underline"
                      >
                        {s.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{s.className ?? "—"}</TableCell>
                    <TableCell>{s.admissionNo ?? "—"}</TableCell>
                    <TableCell>
                      {s.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 sm:hidden">
            {students.map((s) => (
              <Link
                key={s.id}
                href={`/${schoolSlug}/students/${s.id}`}
                className="block rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.fullName}</span>
                  {s.isActive ? (
                    <Badge variant="secondary">Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
                <div className="mt-1 flex justify-between text-sm text-muted-foreground">
                  <span>{s.className ?? "No class"}</span>
                  <span>{s.admissionNo ?? ""}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
