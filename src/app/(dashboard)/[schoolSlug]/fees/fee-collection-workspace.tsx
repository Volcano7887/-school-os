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
  // One search box drives the visible list live (client-side — the full
  // roster for the current class filter is already loaded, no reload
  // needed), instead of a separate autocomplete popup duplicating a second
  // "search by name" box right below it. Seeded from the URL so a shared
  // link still opens pre-filtered.
  const [quickSearch, setQuickSearch] = useState(search);
  const [classFilter, setClassFilter] = useState(classId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const filteredStudents = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    const className = classes.find((c) => c.id === classFilter)?.name;
    return students.filter((s) => {
      if (className && s.className !== className) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNo?.toLowerCase().includes(q) ||
        s.guardianPhone?.includes(q)
      );
    });
  }, [quickSearch, classFilter, classes, students]);

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
      {/* One search box, live client-side — types straight into the list
          below instead of a separate popup duplicating it. */}
      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Search by name, admission no. or phone…"
            className="pl-9"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div ref={panelRef} className="scroll-mt-4">
          <FeeCollectionPanel
            key={selected.studentId}
            schoolSlug={schoolSlug}
            student={selected}
            onDone={() => setSelectedId(null)}
          />
        </div>
      )}

      <div className="space-y-3 pt-2">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
            <Wallet className="size-8 text-muted-foreground" />
            <p className="font-medium">
              {quickSearch || classFilter ? "No students match your search" : "No students yet"}
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
                  {filteredStudents.map((s) => {
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

            {/* Mobile list: compact rows in the locked mockup's shape —
                name + status, then class on the left with the ONE number
                that matters (balance) on the right, and small actions.
                The old version showed "paid / due" (ambiguous) and gave
                every row a full-width Collect button, which made the list
                read as a wall of buttons instead of a list of students. */}
            <div className="space-y-2 sm:hidden">
              {filteredStudents.map((s) => {
                const status = statusFor(s.totalDue, s.totalPaid, s.balance);
                return (
                  <div key={s.studentId} className="rounded-xl border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => selectStudent(s.studentId)}
                        className="min-w-0 flex-1 truncate text-left text-sm font-semibold"
                      >
                        {s.fullName}
                      </button>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {s.className ?? "No class"}
                      </span>
                      {s.balance > 0 ? (
                        <span className="font-mono text-sm font-semibold text-destructive tabular-nums">
                          {inr(s.balance)} due
                        </span>
                      ) : s.balance < 0 ? (
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {inr(Math.abs(s.balance))} advance
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {inr(s.totalPaid)} paid
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      {s.balance > 0 && (
                        <SendReminderDropdown student={s} schoolName={schoolName} />
                      )}
                      <button
                        type="button"
                        onClick={() => selectStudent(s.studentId)}
                        className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground"
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
