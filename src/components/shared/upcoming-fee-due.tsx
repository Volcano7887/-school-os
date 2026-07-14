import Link from "next/link";
import type { UpcomingFeeDueItem } from "@/lib/dashboard/queries";

export function UpcomingFeeDue({
  schoolSlug,
  items,
}: {
  schoolSlug: string;
  items: UpcomingFeeDueItem[];
}) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No pending fees — everyone&apos;s paid up.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li key={item.studentId} className="flex items-center justify-between py-2.5">
          <Link
            href={`/${schoolSlug}/students/${item.studentId}`}
            className="min-w-0 flex-1 hover:underline"
          >
            <p className="truncate text-sm font-medium">{item.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {item.className ?? "No class"}
            </p>
          </Link>
          <p className="text-sm font-medium text-destructive">
            ₹{(item.balance / 100).toLocaleString("en-IN")}
          </p>
        </li>
      ))}
    </ul>
  );
}
