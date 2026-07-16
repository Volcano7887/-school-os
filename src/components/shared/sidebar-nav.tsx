"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, ChevronDown, CheckCheck } from "lucide-react";
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

  // Which labeled groups are collapsed (closed). Starts empty — everything
  // open by default, same as before this feature existed. Keyed by group
  // label since that's already a stable unique identifier per group.
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set());

  function toggleGroup(label: string) {
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  // Default (no manual choice yet): icon-only for md–xl (tablet widths),
  // full labels at xl+. `override` lets the button force either state at
  // ANY width — previously the button only ever added "hidden", so on
  // tablet (below xl) clicking "expand" looked like it did nothing, since
  // the xl: gate silently overrode it. Now override always wins.
  const [override, setOverride] = useState<boolean | null>(null);

  const collapsed = override === false;
  const blockLabel = override === true ? "block" : override === false ? "hidden" : "hidden xl:block";
  const inlineLabel =
    override === true ? "inline" : override === false ? "hidden" : "hidden xl:inline";
  const widthClass =
    override === true ? "md:w-60" : override === false ? "md:w-16" : "md:w-16 xl:w-60";
  const justifyClass =
    override === true
      ? "justify-start"
      : override === false
        ? "justify-center"
        : "justify-center xl:justify-start";

  function toggleCollapsed() {
    if (override !== null) {
      setOverride((prev) => !prev);
      return;
    }
    // No manual choice yet — figure out what's currently showing (depends
    // on viewport, since below xl it's icon-only by default) and flip that.
    const isXlUp = typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches;
    setOverride(!isXlUp);
  }

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar",
        widthClass
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
        {NAV_GROUPS.map((group) => {
          // Icon-only mode has no room for a heading to click, so groups
          // are always "open" (flat icon list) there — the dropdown/
          // collapse behavior only applies once labels are visible.
          const isOpen = collapsed || !closedGroups.has(group.label);
          return (
            <div key={group.label || "primary"} className="space-y-1">
              {group.label &&
                (collapsed ? (
                  <p
                    className={cn(
                      "px-3 text-[11px] font-semibold tracking-wide text-sidebar-foreground/40 uppercase",
                      blockLabel
                    )}
                  >
                    {group.label}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "flex w-full items-center justify-between px-3 text-[11px] font-semibold tracking-wide text-sidebar-foreground/40 uppercase hover:text-sidebar-foreground/70",
                      blockLabel
                    )}
                  >
                    {group.label}
                    <ChevronDown
                      className={cn("size-3.5 transition-transform", !isOpen && "-rotate-90")}
                    />
                  </button>
                ))}
              {isOpen &&
                group.items.map((item) => {
                  const href = `/${activeSlug}${item.href}`;
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={item.href}
                      href={href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        justifyClass,
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
          );
        })}
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
            justifyClass
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-4 shrink-0" />
          ) : (
            <ChevronsLeft className="size-4 shrink-0" />
          )}
          <span className={inlineLabel}>Collapse</span>
        </button>
      </div>
    </aside>
  );
}
