import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Wallet,
  Receipt,
  Banknote,
  BookOpen,
  ScrollText,
  FileBarChart,
  LineChart,
  Paperclip,
  History,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Fees Collection used to be 8 separate nav entries (Collect, Search
// Payments, Search Due, Quick Fees, Types, Discounts, Carry Forward,
// Reminders) — all doors into what's fundamentally one workspace.
// Consolidated per the redesign roadmap (§3000-A): one nav entry, one
// /fees route, with Collect/Due/History as an in-page segmented view.
// The old sub-pages redirect here (see fees/[...old]/route redirects).
const COMMAND_CENTER: NavItem = { label: "Command Center", href: "/dashboard", icon: LayoutDashboard };
const FEES: NavItem = { label: "Fees", href: "/fees", icon: Wallet };
const EXPENSES: NavItem = { label: "Expenses", href: "/expenses", icon: Receipt };
const STUDENTS: NavItem = { label: "Students", href: "/students", icon: Users };
const CLASSES: NavItem = { label: "Classes", href: "/classes", icon: GraduationCap };
const SALARY: NavItem = { label: "Salary", href: "/salary", icon: Banknote };
const CASH_BOOK: NavItem = { label: "Cash Book", href: "/cash-book", icon: BookOpen };
const LEDGER: NavItem = { label: "Ledger", href: "/ledger", icon: ScrollText };
const REPORTS: NavItem = { label: "Reports", href: "/reports", icon: FileBarChart };
const ANALYTICS: NavItem = { label: "Analytics", href: "/analytics", icon: LineChart };
const BILLS: NavItem = { label: "Bills", href: "/bills", icon: Paperclip };
const AUDIT_LOG: NavItem = { label: "Audit Log", href: "/audit-log", icon: History };
const SETTINGS: NavItem = { label: "Settings", href: "/settings", icon: Settings };

// First 4 show in the mobile bottom nav; everything else lives behind "More".
export const NAV_ITEMS: NavItem[] = [
  COMMAND_CENTER,
  FEES,
  EXPENSES,
  STUDENTS,
  SALARY,
  CASH_BOOK,
  LEDGER,
  CLASSES,
  REPORTS,
  ANALYTICS,
  BILLS,
  AUDIT_LOG,
  SETTINGS,
];

export const MOBILE_PRIMARY_COUNT = 4;

export type NavGroup = {
  label: string;
  items: NavItem[];
};

// Sidebar-only grouping (desktop) — matches the locked redesign: Fees
// Collection's 8 entries collapsed into 1, folded into "Money" alongside
// the rest of Finance instead of its own group.
export const NAV_GROUPS: NavGroup[] = [
  { label: "", items: [COMMAND_CENTER] },
  { label: "Money", items: [FEES, EXPENSES, SALARY, CASH_BOOK, LEDGER] },
  { label: "People", items: [STUDENTS, CLASSES] },
  { label: "Insights", items: [REPORTS, ANALYTICS] },
  { label: "System", items: [BILLS, AUDIT_LOG, SETTINGS] },
];
