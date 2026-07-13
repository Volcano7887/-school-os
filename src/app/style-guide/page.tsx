import { TrendingUp, TrendingDown, Wallet, Clock, Users, FileX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/shared/stat-card";
import { Breadcrumb } from "@/components/shared/breadcrumb";

const FEE_ROWS = [
  { name: "Abdullah Jameer Beg", cls: "1st", total: 3600, paid: 3600, status: "paid" },
  { name: "Shaikh Ibrahim Iftekhar", cls: "1st", total: 3600, paid: 2850, status: "partial" },
  { name: "Khan Mursaleen Mubeen", cls: "2nd", total: 3600, paid: 250, status: "overdue" },
  { name: "Ansari Adnan Arif", cls: "2nd", total: 3600, paid: 0, status: "pending" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  pending: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  pending: "Pending",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 p-6">
      <div>
        <h1 className="text-2xl font-semibold">School OS — Style Guide</h1>
        <p className="text-muted-foreground">
          Internal reference only. Locked in from your reference mockup —
          this is what every module gets built against from here.
        </p>
      </div>

      {/* Direction summary */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Direction (from your reference)</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Dark navy sidebar (see the real sidebar on this page right now) —
            fixed brand element, stays dark regardless of light/dark mode.
          </li>
          <li>Primary buttons match that same navy, not a bright accent color.</li>
          <li>
            Stat tiles get a colored icon chip per category (green/red/blue/
            orange/purple) rather than one accent color everywhere.
          </li>
          <li>Green = income/positive, red = expense/negative, consistently.</li>
          <li>Breadcrumbs under every page title.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          <strong>Deferred, not forgotten:</strong> the global search bar
          (⌘K), notification bell, and top-bar avatar from your reference
          need real data (students/receipts/invoices, notification events) to
          be more than decoration — building them now would be a fake,
          non-functional shell. We&apos;ll add them once there&apos;s something real to
          search and notify about.
        </p>
      </section>

      {/* Breadcrumb */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Breadcrumb</h2>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/demo/dashboard" },
            { label: "Fee Collection" },
          ]}
        />
      </section>

      {/* Status colors */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">3. Status colors</h2>
        <p className="text-sm text-muted-foreground">
          Fixed everywhere in the app — paid/partial/overdue need to be
          recognizable at a glance.
        </p>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="paid" />
          <StatusBadge status="partial" />
          <StatusBadge status="overdue" />
          <StatusBadge status="pending" />
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Typography (Geist Sans)</h2>
        <div className="space-y-1">
          <p className="text-2xl font-semibold">Page title — text-2xl</p>
          <p className="text-lg font-medium">Section heading — text-lg</p>
          <p className="text-sm">Body text — text-sm</p>
          <p className="text-sm text-muted-foreground">Muted / helper text — text-sm</p>
        </div>
      </section>

      {/* Stat tiles */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          5. Stat tiles — colored icon chips (real dashboard component)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Today's Collection" value="₹45,300" icon={TrendingUp} color="green" caption="+12.5% from yesterday" />
          <StatCard label="Today's Expenses" value="₹7,850" icon={TrendingDown} color="red" caption="-6.4% from yesterday" />
          <StatCard label="Cash in Hand" value="₹1,85,600" icon={Wallet} color="blue" />
          <StatCard label="Pending Fees" value="₹3,42,000" icon={Clock} color="orange" caption="23 students" />
          <StatCard label="Pending Salaries" value="₹80,000" icon={Users} color="purple" caption="5 staff" />
        </div>
      </section>

      {/* Chart color convention */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Chart color convention</h2>
        <p className="text-sm text-muted-foreground">
          Not building a real chart yet (needs real data) — just locking the
          convention so every future chart follows it.
        </p>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-green-500" /> Income
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-red-500" /> Expense
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">7. Form (e.g. record a fee payment)</h2>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
            <CardDescription>Abdullah Jameer Beg — 1st</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" placeholder="250" />
            </div>
            <Button className="w-full">Save payment</Button>
          </CardContent>
        </Card>
      </section>

      {/* Data table — desktop pattern */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          8. Data table (desktop) vs. card list (mobile)
        </h2>
        <div className="hidden overflow-x-auto rounded-lg border sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEE_ROWS.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.cls}</TableCell>
                  <TableCell>₹{row.total.toLocaleString("en-IN")}</TableCell>
                  <TableCell>₹{row.paid.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Same data, mobile card pattern — no horizontal scrolling a table */}
        <div className="space-y-2 sm:hidden">
          {FEE_ROWS.map((row) => (
            <div key={row.name} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{row.name}</span>
                <StatusBadge status={row.status} />
              </div>
              <div className="mt-1 flex justify-between text-sm text-muted-foreground">
                <span>{row.cls}</span>
                <span>
                  ₹{row.paid.toLocaleString("en-IN")} / ₹
                  {row.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground sm:hidden">
          ↑ You&apos;re viewing this at mobile width, so you&apos;re seeing the
          card pattern right now instead of the table.
        </p>
      </section>

      {/* Empty state */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">9. Empty state</h2>
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <FileX2 className="size-8 text-muted-foreground" />
          <p className="font-medium">No fee payments recorded yet</p>
          <p className="text-sm text-muted-foreground">
            Once you record a payment, it&apos;ll show up here.
          </p>
          <Button size="sm" className="mt-2">
            Record a payment
          </Button>
        </div>
      </section>
    </div>
  );
}
