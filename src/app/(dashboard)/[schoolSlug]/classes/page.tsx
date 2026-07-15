import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getClassesWithCounts } from "@/lib/students/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { AddClassDialog, RenameClassDialog } from "./class-dialog";

export default async function ClassesPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const classes = await getClassesWithCounts(supabase, schoolId);

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Classes" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Classes</h1>
          <p className="text-sm text-muted-foreground">
            {classes.length} {classes.length === 1 ? "class" : "classes"}
          </p>
        </div>
        <AddClassDialog schoolSlug={schoolSlug} />
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <GraduationCap className="size-8 text-muted-foreground" />
          <p className="font-medium">No classes yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first class to start assigning students and fee structures.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.studentCount} {c.studentCount === 1 ? "student" : "students"}
                  </p>
                </div>
                <RenameClassDialog
                  schoolSlug={schoolSlug}
                  classId={c.id}
                  currentName={c.name}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
