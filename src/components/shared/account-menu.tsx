"use client";

import Link from "next/link";
import { ChevronDown, Check, Plus, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/features/auth/actions";
import type { UserSchool } from "@/lib/school/queries";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  school_admin: "School Admin",
  principal: "Principal",
  accountant: "Accountant",
  teacher: "Teacher",
  parent: "Parent",
  student: "Student",
};

export function AccountMenu({
  name,
  email,
  role,
  schools,
  activeSlug,
}: {
  name: string;
  email: string;
  role: string;
  schools: UserSchool[];
  activeSlug: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-w-0 items-center gap-2 rounded-md p-1.5 text-left transition-colors hover:bg-muted"
        >
          <Avatar size="sm" className="shrink-0">
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          {/* Explicit max-width, not just `truncate` — truncate only
              activates once something actually constrains the box, and
              nothing upstream was doing that, so the full email address
              (e.g. "amersohel9@gmail.com") rendered at full width and
              pushed the topbar past the viewport on narrower screens. */}
          <span className="hidden max-w-28 min-w-0 sm:block lg:max-w-36">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {ROLE_LABEL[role] ?? role}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block truncate font-medium">{name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Per the redesign roadmap (§3000-C): the switcher is noise for
            anyone who only ever runs one school — most Principals — so it
            only renders at all once an account actually belongs to more
            than one. */}
        {schools.length > 1 && (
          <>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Switch school
            </DropdownMenuLabel>
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
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/onboarding" className="flex w-full items-center gap-1.5">
            <Plus className="size-4" />
            Add school
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut className="size-4" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
