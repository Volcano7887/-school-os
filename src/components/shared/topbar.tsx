"use client";

import Link from "next/link";
import { Search, Bell, ChevronDown, Check } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AccountMenu } from "@/components/shared/account-menu";
import { QuickActionMenu } from "@/components/shared/quick-action-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const activeSchool = schools.find((s) => s.slug === activeSlug);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:h-14 md:gap-4 md:px-6">
      {/* Mobile: the school you're looking at, always visible — this was
          missing entirely on phones (the topbar was md+ only), which left
          no context and no switcher for the one user who runs 4 schools.
          Switcher renders only for multi-school accounts (§3000-C). */}
      {schools.length > 1 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 items-center gap-1 text-sm font-semibold md:hidden"
            >
              <span className="truncate">{activeSchool?.name ?? "School"}</span>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
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
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="truncate text-sm font-semibold md:hidden">
          {activeSchool?.name ?? ""}
        </span>
      )}

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("school-os:open-command-palette"))}
        className="relative hidden min-w-0 max-w-md flex-1 text-left md:block"
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <span className="flex h-9 w-full items-center overflow-hidden rounded-md border bg-muted/30 pr-16 pl-9 text-sm text-nowrap text-muted-foreground hover:bg-muted/50">
          <span className="truncate">Search students, or jump to a page…</span>
        </span>
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Ctrl+K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
        <div className="hidden sm:block">
          <QuickActionMenu schoolSlug={activeSlug} />
        </div>

        <div className="hidden md:block">
          <ThemeToggle />
        </div>

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
      </div>
    </header>
  );
}
