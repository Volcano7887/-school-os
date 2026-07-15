"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { useEffect } from "react";
import { updateSchool } from "@/features/schools/actions";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SchoolProfile } from "@/lib/school/queries";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function SettingsForm({
  schoolSlug,
  school,
}: {
  schoolSlug: string;
  school: SchoolProfile;
}) {
  const action = updateSchool.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "success") toast.success("Settings saved");
  }, [state.status]);

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>School Profile</CardTitle>
        <CardDescription>
          Only a school admin can edit these details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="name">School name</Label>
            <Input id="name" name="name" defaultValue={school.name} required />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={school.address ?? undefined} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={school.phone ?? undefined} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={school.email ?? undefined} />
              {state.fieldErrors?.email && (
                <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="academicYearStartMonth">Academic year starts in</Label>
            <Select
              name="academicYearStartMonth"
              defaultValue={String(school.academicYearStartMonth)}
            >
              <SelectTrigger id="academicYearStartMonth" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used as the default when setting up a new academic year — doesn&apos;t
              change years you&apos;ve already created.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dailyFeeTarget">Daily collection goal (₹)</Label>
              <Input
                id="dailyFeeTarget"
                name="dailyFeeTarget"
                type="number"
                min="0"
                step="1"
                defaultValue={
                  school.dailyFeeTarget != null ? school.dailyFeeTarget / 100 : undefined
                }
                placeholder="e.g. 35000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monthlyFeeTarget">Monthly collection goal (₹)</Label>
              <Input
                id="monthlyFeeTarget"
                name="monthlyFeeTarget"
                type="number"
                min="0"
                step="1"
                defaultValue={
                  school.monthlyFeeTarget != null ? school.monthlyFeeTarget / 100 : undefined
                }
                placeholder="e.g. 1000000"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Powers the &quot;Today&apos;s Goal&quot; sidebar widget and the Monthly Collection
            panel on the dashboard. Leave blank to hide them.
          </p>

          {state.status === "error" && state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
