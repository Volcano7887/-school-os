"use client";

import { Search, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AccountMenu } from "@/components/shared/account-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { UserSchool } from "@/lib/school/queries";

export function Topbar({
  userName,
  userEmail,
  userRole,
  schools,
  activeSlug,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
  schools: UserSchool[];
  activeSlug: string;
}) {
  return (
    <header className="hidden h-14 items-center gap-2 border-b px-4 md:flex md:gap-4 md:px-6">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("school-os:open-command-palette"))}
        className="relative min-w-0 max-w-md flex-1 text-left"
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <span className="flex h-9 w-full items-center overflow-hidden rounded-md border bg-muted/30 pr-16 pl-9 text-sm text-nowrap text-muted-foreground hover:bg-muted/50">
          <span className="truncate">Search students, or jump to a page…</span>
        </span>
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Ctrl+K
        </kbd>
      </button>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <p className="px-1.5 py-3 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountMenu
        name={userName}
        email={userEmail}
        role={userRole}
        schools={schools}
        activeSlug={activeSlug}
      />
    </header>
  );
}
