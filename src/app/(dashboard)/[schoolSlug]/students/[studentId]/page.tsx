import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getClasses, getStudent } from "@/lib/students/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StudentFormDialog } from "../student-form-dialog";

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

  const [student, classes] = await Promise.all([
    getStudent(supabase, schoolId, studentId),
    getClasses(supabase, schoolId),
  ]);

  if (!student) notFound();

  const className = classes.find((c) => c.id === student.class_id)?.name;

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Students", href: `/${schoolSlug}/students` },
          { label: student.full_name },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{student.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {className ?? "No class"}
            {student.admission_no && ` · Admission No. ${student.admission_no}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {student.is_active ? (
            <Badge variant="secondary">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          )}
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
      </div>

      <p className="text-xs text-muted-foreground">
        Fee history and payment details land here once the Fee Collection
        module is built.
      </p>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
