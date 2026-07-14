"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { NAV_ITEMS } from "@/components/shared/nav-items";
import { searchStudentsForCommandPalette } from "@/features/command-palette/actions";
import type { CommandPaletteStudent } from "@/features/command-palette/actions";

export function CommandPalette({ schoolSlug }: { schoolSlug: string }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [students, setStudents] = React.useState<CommandPaletteStudent[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    function onOpenRequest() {
      setOpen(true);
    }
    window.addEventListener("school-os:open-command-palette", onOpenRequest);
    return () => window.removeEventListener("school-os:open-command-palette", onOpenRequest);
  }, []);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timeout = setTimeout(() => {
      searchStudentsForCommandPalette(schoolSlug, q).then(setStudents);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, schoolSlug]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setStudents([]);
    }
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    if (next.trim().length < 2) setStudents([]);
  }

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search students, or jump to a page…"
        value={query}
        onValueChange={handleQueryChange}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {students.length > 0 && (
          <CommandGroup heading="Students">
            {students.map((s) => (
              <CommandItem
                key={s.id}
                value={`student-${s.id}-${s.fullName}`}
                onSelect={() => go(`/${schoolSlug}/students/${s.id}`)}
              >
                <User />
                <span>{s.fullName}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {s.className ?? "No class"}
                  {s.admissionNo ? ` · ${s.admissionNo}` : ""}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Go to">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              value={`nav-${item.href}-${item.label}`}
              onSelect={() => go(`/${schoolSlug}${item.href}`)}
            >
              <item.icon />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
