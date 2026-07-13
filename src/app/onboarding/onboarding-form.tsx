"use client";

import { useActionState } from "react";
import { createSchool } from "@/features/schools/actions";
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

export function OnboardingForm({ isFirstSchool }: { isFirstSchool: boolean }) {
  const [state, formAction, isPending] = useActionState(
    createSchool,
    initialActionState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isFirstSchool ? "Set up your school" : "Add a school"}</CardTitle>
        <CardDescription>
          {isFirstSchool
            ? "Create your school to start tracking fees, expenses, and salaries."
            : "Each school keeps its own separate books."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="name">School name</Label>
            <Input id="name" name="name" placeholder="e.g. Green Valley School" required />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" placeholder="Optional" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" placeholder="Optional" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="Optional" />
              {state.fieldErrors?.email && (
                <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
              )}
            </div>
          </div>

          {state.status === "error" && state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating…" : "Create school"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
