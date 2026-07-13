"use client";

import { useActionState, useEffect, useState } from "react";
import { createStudent, updateStudent } from "@/features/students/actions";
import { initialActionState } from "@/lib/types/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SchoolClass } from "@/lib/students/queries";
import type { Database } from "@/types/database.types";

type StudentRow = Database["public"]["Tables"]["students"]["Row"];

export function StudentFormDialog({
  schoolSlug,
  classes,
  student,
  trigger,
}: {
  schoolSlug: string;
  classes: SchoolClass[];
  student?: StudentRow;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!student;

  const action = isEdit
    ? updateStudent.bind(null, schoolSlug, student.id)
    : createStudent.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  useEffect(() => {
    // Syncing to an external signal (the server action's result), not
    // deriving render state — closing the dialog here is the correct place.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.status === "success") setOpen(false);
  }, [state.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={student?.full_name}
              required
            />
            {state.fieldErrors?.fullName && (
              <p className="text-sm text-destructive">{state.fieldErrors.fullName[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="classId">Class</Label>
              <Select name="classId" defaultValue={student?.class_id ?? undefined}>
                <SelectTrigger id="classId" className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {classes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No classes yet — use &quot;Manage classes&quot; first.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admissionNo">Admission no.</Label>
              <Input
                id="admissionNo"
                name="admissionNo"
                defaultValue={student?.admission_no ?? undefined}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="gender">Gender</Label>
              <Select name="gender" defaultValue={student?.gender ?? undefined}>
                <SelectTrigger id="gender" className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" name="dob" type="date" defaultValue={student?.dob ?? undefined} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="guardianName">Guardian name</Label>
              <Input
                id="guardianName"
                name="guardianName"
                defaultValue={student?.guardian_name ?? undefined}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guardianPhone">Guardian phone</Label>
              <Input
                id="guardianPhone"
                name="guardianPhone"
                defaultValue={student?.guardian_phone ?? undefined}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="guardianEmail">Guardian email</Label>
            <Input
              id="guardianEmail"
              name="guardianEmail"
              type="email"
              defaultValue={student?.guardian_email ?? undefined}
            />
            {state.fieldErrors?.guardianEmail && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.guardianEmail[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={student?.address ?? undefined} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admissionDate">Admission date</Label>
            <Input
              id="admissionDate"
              name="admissionDate"
              type="date"
              defaultValue={student?.admission_date ?? undefined}
            />
          </div>

          {state.status === "error" && state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Add student"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
