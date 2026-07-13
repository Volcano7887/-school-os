"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SchoolClass } from "@/lib/students/queries";

export function FilterBar({
  classes,
  search,
  classId,
}: {
  classes: SchoolClass[];
  search: string;
  classId: string;
}) {
  return (
    <form method="get" className="flex flex-wrap gap-2">
      <Input
        name="q"
        defaultValue={search}
        placeholder="Search by name…"
        className="max-w-xs"
      />
      <select
        name="classId"
        defaultValue={classId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">All classes</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}
