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

export function Topbar({
  userName,
  userEmail,
  userRole,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  return (
    <header className="hidden h-14 items-center gap-4 border-b px-6 md:flex">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          disabled
          placeholder="Search students, receipts, invoices…"
          title="Coming soon — lands with the modules that produce this data"
          className="h-9 w-full rounded-md border bg-muted/30 pl-9 pr-16 text-sm text-muted-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Ctrl+K
        </kbd>
      </div>

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

      <AccountMenu name={userName} email={userEmail} role={userRole} />
    </header>
  );
}
