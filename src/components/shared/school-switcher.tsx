"use client";

import Link from "next/link";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserSchool } from "@/lib/school/queries";

export function SchoolSwitcher({
  schools,
  activeSlug,
}: {
  schools: UserSchool[];
  activeSlug: string;
}) {
  const active = schools.find((s) => s.slug === activeSlug);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60"
        >
          <span className="truncate">{active?.name ?? "Select school"}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {schools.map((school) => (
          <DropdownMenuItem key={school.id} asChild>
            <Link
              href={`/${school.slug}/dashboard`}
              className="flex w-full items-center justify-between"
            >
              <span className="truncate">{school.name}</span>
              {school.slug === activeSlug && <Check className="size-4" />}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding" className="flex w-full items-center gap-1.5">
            <Plus className="size-4" />
            Add school
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
