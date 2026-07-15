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
// Order here is the mobile order — Classes/Analytics are appended at the end
// so they don't shift which 4 items mobile shows.
export const NAV_ITEMS: NavItem[] = [
  COMMAND_CENTER,
  FEES,
  EXPENSES,
  STUDENTS,
  SALARY,
  CASH_BOOK,
  LEDGER,
  REPORTS,
  BILLS,
  AUDIT_LOG,
  SETTINGS,
  CLASSES,
  ANALYTICS,
];

export const MOBILE_PRIMARY_COUNT = 4;

export type NavGroup = {
  label: string;
  items: NavItem[];
};

// Sidebar-only grouping (desktop) — order here matches the mockup, not the
// mobile bottom nav's flat order above.
export const NAV_GROUPS: NavGroup[] = [
  { label: "", items: [COMMAND_CENTER] },
  { label: "Finance", items: [FEES, EXPENSES, SALARY, CASH_BOOK, LEDGER] },
  { label: "Students", items: [STUDENTS, CLASSES] },
  { label: "Reports", items: [REPORTS, ANALYTICS] },
  { label: "Others", items: [BILLS, AUDIT_LOG, SETTINGS] },
];
