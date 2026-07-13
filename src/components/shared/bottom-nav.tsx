"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, LogOut, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, MOBILE_PRIMARY_COUNT } from "@/components/shared/nav-items";
import { logout } from "@/features/auth/actions";
import type { UserSchool } from "@/lib/school/queries";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function BottomNav({
  schools,
  activeSlug,
}: {
  schools: UserSchool[];
  activeSlug: string;
}) {
  const pathname = usePathname();
  const primaryItems = NAV_ITEMS.slice(0, MOBILE_PRIMARY_COUNT);
  const moreItems = NAV_ITEMS.slice(MOBILE_PRIMARY_COUNT);
  const isMoreActive = moreItems.some((item) =>
    pathname.startsWith(`/${activeSlug}${item.href}`)
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t bg-background/95 backdrop-blur md:hidden [padding-bottom:env(safe-area-inset-bottom)]">
      {primaryItems.map((item) => {
        const href = `/${activeSlug}${item.href}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        );
      })}

      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              isMoreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="size-5" />
            More
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>

          {schools.length > 1 && (
            <div className="space-y-1 border-b px-4 pb-3">
              <p className="text-xs font-medium text-muted-foreground">
                Switch school
              </p>
              {schools.map((school) => (
                <Link
                  key={school.id}
                  href={`/${school.slug}/dashboard`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
                >
                  <span>{school.name}</span>
                  {school.slug === activeSlug && (
                    <Check className="size-4 text-primary" />
                  )}
                </Link>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 p-4 pt-3">
            {moreItems.map((item) => (
              <Link
                key={item.href}
                href={`/${activeSlug}${item.href}`}
                className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            ))}
          </div>
          <form action={logout} className="border-t p-4 pt-3">
            <button
              type="submit"
              className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
