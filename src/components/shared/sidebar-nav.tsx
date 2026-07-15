"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/components/shared/nav-items";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function TodaysGoal({
  activeSlug,
  dailyFeeTarget,
  todayCollection,
}: {
  activeSlug: string;
  dailyFeeTarget: number | null;
  todayCollection: number;
}) {
  if (!dailyFeeTarget) {
    return (
      <Link
        href={`/${activeSlug}/settings`}
        className="block rounded-lg border border-dashed p-3 text-xs text-sidebar-foreground/60 hover:border-sidebar-primary hover:text-sidebar-primary"
      >
        Set a daily collection goal in Settings
      </Link>
    );
  }

  const pct = Math.min(Math.round((todayCollection / dailyFeeTarget) * 100), 100);

  return (
    <div className="rounded-lg border border-sidebar-border bg-sidebar p-3">
      <p className="text-xs font-medium text-sidebar-foreground/70">Today&apos;s Goal</p>
      <p className="text-lg font-semibold text-sidebar-foreground">{inr(dailyFeeTarget)}</p>
      <p className="text-[11px] text-sidebar-foreground/50">Collection Target</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sidebar-accent">
        <div
          className="h-full rounded-full bg-sidebar-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-sidebar-foreground/60">
        <span>Collected {inr(todayCollection)}</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}

export function SidebarNav({
  activeSlug,
  dailyFeeTarget,
  todayCollection,
}: {
  activeSlug: string;
  dailyFeeTarget: number | null;
  todayCollection: number;
}) {
  const pathname = usePathname();
  // Manually collapsing (via the button) forces icon-only at every width
  // ≥ md. Left at its default, the sidebar auto-collapses to icon-only in
  // the tablet range (md–lg, e.g. an 11" iPad) since there isn't enough
  // room there for full labels, and only opens up to full width at lg+.
  const [collapsed, setCollapsed] = useState(false);

  // Block-level content (section headings, logo text, Today's Goal, the
  // Collapse button's own label) — hidden entirely when collapsed, else
  // only shown from lg up.
  const blockLabel = collapsed ? "hidden" : "hidden lg:block";
  const inlineLabel = collapsed ? "hidden" : "hidden lg:inline";

  function toggleCollapsed() {
    setCollapsed((prev) => !prev);
  }

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar",
        collapsed ? "md:w-16" : "md:w-16 lg:w-60"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <CheckCheck className="size-4" />
        </div>
        <span className={cn("truncate px-1 text-sm font-semibold text-sidebar-foreground", blockLabel)}>
          School OS
        </span>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label || "primary"} className="space-y-1">
            {group.label && (
              <p
                className={cn(
                  "px-3 text-[11px] font-semibold tracking-wide text-sidebar-foreground/40 uppercase",
                  blockLabel
                )}
              >
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const href = `/${activeSlug}${item.href}`;
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed ? "justify-center" : "justify-center lg:justify-start",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="size-[18px] shrink-0" strokeWidth={2.25} />
                  <span className={inlineLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border p-2">
        <div className={blockLabel}>
          <TodaysGoal
            activeSlug={activeSlug}
            dailyFeeTarget={dailyFeeTarget}
            todayCollection={todayCollection}
          />
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            collapsed ? "justify-center" : "justify-center lg:justify-start"
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-4 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="size-4 shrink-0" />
              <span className={inlineLabel}>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
