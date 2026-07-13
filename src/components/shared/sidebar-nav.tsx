"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/shared/nav-items";
import { SchoolSwitcher } from "@/components/shared/school-switcher";
import { AccountMenu } from "@/components/shared/account-menu";
import type { UserSchool } from "@/lib/school/queries";

export function SidebarNav({
  schools,
  activeSlug,
  userName,
  userEmail,
  userRole,
}: {
  schools: UserSchool[];
  activeSlug: string;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar">
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <span className="px-2 text-sm font-semibold text-sidebar-foreground">
          School OS
        </span>
      </div>
      <div className="border-b border-sidebar-border p-2">
        <SchoolSwitcher schools={schools} activeSlug={activeSlug} />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const href = `/${activeSlug}${item.href}`;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-2">
        <AccountMenu name={userName} email={userEmail} role={userRole} showLabel />
      </div>
    </aside>
  );
}
