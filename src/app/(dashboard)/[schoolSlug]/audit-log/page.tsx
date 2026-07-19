import { History, Wallet, Receipt, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getAuditLog, type AuditLogEntry } from "@/lib/audit-log/queries";

const ENTRY_STYLE: Record<string, { icon: typeof Wallet; className: string }> = {
  "Fee Payment": {
    icon: Wallet,
    className: "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  },
  Expense: {
    icon: Receipt,
    className: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  },
  "Salary Payment": {
    icon: Banknote,
    className: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  },
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.toDateString() === b.toDateString();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

function groupByDay(entries: AuditLogEntry[]) {
  const groups = new Map<string, AuditLogEntry[]>();
  for (const entry of entries) {
    const label = dayLabel(entry.createdAt);
    const list = groups.get(label) ?? [];
    list.push(entry);
    groups.set(label, list);
  }
  return [...groups.entries()];
}

function actionVerb(action: AuditLogEntry["action"]) {
  return action === "create" ? "recorded" : action;
}

export default async function AuditLogPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const entries = await getAuditLog(supabase, schoolId);
  const groups = groupByDay(entries);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Every fee payment, expense, and salary payment recorded — who, what,
          and when. Read-only, most recent 200 shown.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <History className="size-8 text-muted-foreground" />
          <p className="font-medium">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([label, dayEntries]) => (
            <div key={label}>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
              </p>
              <div className="space-y-1 rounded-lg border bg-card">
                {dayEntries.map((e, i) => {
                  const style = ENTRY_STYLE[e.tableName] ?? {
                    icon: History,
                    className: "bg-muted text-muted-foreground",
                  };
                  const Icon = style.icon;
                  return (
                    <div
                      key={e.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i > 0 ? "border-t" : ""
                      }`}
                    >
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${style.className}`}
                      >
                        <Icon className="size-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{e.userName}</span>{" "}
                          {actionVerb(e.action)} a{" "}
                          <span className="font-medium">{e.tableName}</span>
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTime(e.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
