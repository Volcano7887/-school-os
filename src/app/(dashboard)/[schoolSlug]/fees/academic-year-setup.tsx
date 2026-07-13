"use client";

import { useActionState } from "react";
import { createAcademicYear } from "@/features/academic-years/actions";
import { initialActionState } from "@/lib/types/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function defaultRange() {
  const now = new Date();
  // Academic year runs June -> May (confirmed from the user's real records).
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const endYear = startYear + 1;
  return {
    name: `${startYear}-${endYear}`,
    start: `${startYear}-06-01`,
    end: `${endYear}-05-31`,
  };
}

export function AcademicYearSetup({ schoolSlug }: { schoolSlug: string }) {
  const action = createAcademicYear.bind(null, schoolSlug);
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const defaults = defaultRange();

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Set up an academic year</CardTitle>
        <CardDescription>
          Fee collection is tracked per academic year. Your school&apos;s runs
          June to May by default — adjust if needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={defaults.name} required />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={defaults.start}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={defaults.end}
                required
              />
              {state.fieldErrors?.endDate && (
                <p className="text-sm text-destructive">{state.fieldErrors.endDate[0]}</p>
              )}
            </div>
          </div>
          {state.status === "error" && state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating…" : "Create academic year"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
