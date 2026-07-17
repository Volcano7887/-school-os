import Link from "next/link";
import { cn } from "@/lib/utils";

// The redesign's central move for this page: Collect, Search Due Fees, and
// Search Fees Payment used to be three separate nav destinations for what's
// fundamentally one workspace. Now they're one page, one segmented control —
// state lives in the URL (?view=) so each tab stays linkable/bookmarkable,
// same as the pages it replaces.
export function FeesTabs({
  schoolSlug,
  active,
  dueCount,
}: {
  schoolSlug: string;
  active: "collect" | "due" | "history";
  dueCount: number;
}) {
  const tabs = [
    { key: "collect" as const, label: "Collect" },
    { key: "due" as const, label: `Due${dueCount > 0 ? ` (${dueCount})` : ""}` },
    { key: "history" as const, label: "History" },
  ];

  return (
    // Full-width with equal segments on phones (matches the mockup's mobile
    // frame), shrink-to-content from sm up.
    <div className="flex w-full gap-1 rounded-lg border bg-card p-1 sm:inline-flex sm:w-auto">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.key === "collect" ? `/${schoolSlug}/fees` : `/${schoolSlug}/fees?view=${tab.key}`}
          className={cn(
            "flex-1 rounded-md px-3.5 py-1.5 text-center text-sm font-medium transition-colors sm:flex-initial",
            active === tab.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
