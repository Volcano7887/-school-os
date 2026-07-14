"use client";

import { useMemo, useRef, useState } from "react";
import { Search, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar } from "@/components/shared/filter-bar";
import { SendReminderDropdown } from "./send-reminder-dropdown";
import { FeeCollectionPanel } from "./fee-collection-panel";
import type { StudentBalance } from "@/lib/fees/queries";
import type { SchoolClass } from "@/lib/students/queries";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function formatBalance(balance: number) {
  if (balance < 0) return `${inr(Math.abs(balance))} advance`;
  return inr(balance);
}

function statusFor(totalDue: number, totalPaid: number, balance: number) {
  if (balance < 0)
    return {
      label: "Advance",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    };
  if (totalDue === 0) return { label: "No dues", className: "bg-muted text-muted-foreground" };
  if (balance === 0)
    return {
      label: "Paid",
      className: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    };
  if (totalPaid > 0)
    return {
      label: "Partial",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    };
  return { label: "Pending", className: "bg-muted text-muted-foreground" };
}

export function FeeCollectionWorkspace({
  schoolSlug,
  schoolName,
  students,
  classes,
  search,
  classId,
}: {
  schoolSlug: string;
  schoolName: string;
  students: StudentBalance[];
  classes: SchoolClass[];
  search: string;
  classId: string;
}) {
  const [quickSearch, setQuickSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return [];
    return students
      .filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.admissionNo?.toLowerCase().includes(q) ||
          s.guardianPhone?.includes(q)
      )
      .slice(0, 8);
  }, [quickSearch, students]);

  const selected = students.find((s) => s.studentId === selectedId) ?? null;

  function selectStudent(id: string) {
    setSelectedId(id);
    setQuickSearch("");
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="space-y-4">
      {/* Search-first entry point, matching the reference */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
          placeholder="Search student by name, admission no. or phone…"
          className="pl-9"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
            {suggestions.map((s) => (
              <button
                key={s.studentId}
                type="button"
                onClick={() => selectStudent(s.studentId)}
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

      <div ref={panelRef} className="scroll-mt-4">
        {selected ? (
          <FeeCollectionPanel
            key={selected.studentId}
            schoolSlug={schoolSlug}
            student={selected}
            onDone={() => setSelectedId(null)}
          />
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Search for a student above, or pick one from the list below, to record a payment.
          </p>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-medium text-muted-foreground">All students</h2>
        <FilterBar classes={classes} search={search} classId={classId} />

        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
            <Wallet className="size-8 text-muted-foreground" />
            <p className="font-medium">
              {search || classId ? "No students match your search" : "No students yet"}
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
                    <TableHead>Total Due</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => {
                    const status = statusFor(s.totalDue, s.totalPaid, s.balance);
                    return (
                      <TableRow key={s.studentId}>
                        <TableCell className="font-medium">{s.fullName}</TableCell>
                        <TableCell>{s.className ?? "—"}</TableCell>
                        <TableCell>{inr(s.totalDue)}</TableCell>
                        <TableCell>{inr(s.totalPaid)}</TableCell>
                        <TableCell>{formatBalance(s.balance)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {s.balance > 0 && (
                              <SendReminderDropdown student={s} schoolName={schoolName} />
                            )}
                            <button
                              type="button"
                              onClick={() => selectStudent(s.studentId)}
                              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                            >
                              Collect
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2 sm:hidden">
              {students.map((s) => {
                const status = statusFor(s.totalDue, s.totalPaid, s.balance);
                return (
                  <div key={s.studentId} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.fullName}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-sm text-muted-foreground">
                      <span>{s.className ?? "No class"}</span>
                      <span>
                        {inr(s.totalPaid)} / {inr(s.totalDue)}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {s.balance > 0 && (
                        <SendReminderDropdown student={s} schoolName={schoolName} />
                      )}
                      <button
                        type="button"
                        onClick={() => selectStudent(s.studentId)}
                        className="flex-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
