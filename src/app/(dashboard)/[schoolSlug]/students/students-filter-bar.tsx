"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SchoolClass } from "@/lib/students/queries";

export function StudentsFilterBar({
  classes,
  search,
  classId,
  status,
}: {
  classes: SchoolClass[];
  search: string;
  classId: string;
  status: string;
}) {
  return (
    <form method="get" className="flex flex-wrap gap-2">
      <Input
        name="q"
        defaultValue={search}
        placeholder="Search students…"
        className="max-w-xs"
      />
      <select
        name="classId"
        defaultValue={classId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">All Classes</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">All Status</option>
        <option value="due">Due</option>
        <option value="clear">Clear</option>
      </select>
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}
