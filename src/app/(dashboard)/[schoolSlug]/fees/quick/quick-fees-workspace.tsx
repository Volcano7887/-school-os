"use client";

import { useMemo, useState } from "react";
import { Search, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FeeCollectionPanel } from "../fee-collection-panel";
import type { StudentBalance } from "@/lib/fees/queries";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function QuickFeesWorkspace({
  schoolSlug,
  students,
}: {
  schoolSlug: string;
  students: StudentBalance[];
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return students
      .filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.admissionNo?.toLowerCase().includes(q) ||
          s.guardianPhone?.includes(q)
      )
      .slice(0, 8);
  }, [search, students]);

  const selected = students.find((s) => s.studentId === selectedId) ?? null;

  if (selected) {
    return (
      <FeeCollectionPanel
        key={selected.studentId}
        schoolSlug={schoolSlug}
        student={selected}
        onDone={() => {
          setSelectedId(null);
          setSearch("");
        }}
      />
    );
  }

  return (
    <div className="relative mx-auto max-w-md">
      <div className="mb-3 flex items-center justify-center gap-2 text-muted-foreground">
        <Zap className="size-4" />
        <p className="text-sm">Search a student to collect a fee — nothing else in the way.</p>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, admission no. or phone…"
          className="pl-9"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
          {suggestions.map((s) => (
            <button
              key={s.studentId}
              type="button"
              onClick={() => setSelectedId(s.studentId)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span>
                {s.fullName}{" "}
                <span className="text-muted-foreground">({s.className ?? "No class"})</span>
              </span>
              {s.balance > 0 && (
                <span className="text-xs text-destructive">{inr(s.balance)} due</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
