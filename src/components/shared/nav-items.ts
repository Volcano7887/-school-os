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
  Search,
  AlertCircle,
  Zap,
  Tag,
  Percent,
  CornerDownRight,
  BellRing,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const COMMAND_CENTER: NavItem = { label: "Command Center", href: "/dashboard", icon: LayoutDashboard };
const COLLECT_FEES: NavItem = { label: "Collect Fees", href: "/fees", icon: Wallet };
const SEARCH_FEES_PAYMENT: NavItem = { label: "Search Fees Payment", href: "/fees/search-payments", icon: Search };
const SEARCH_DUE_FEES: NavItem = { label: "Search Due Fees", href: "/fees/due", icon: AlertCircle };
const QUICK_FEES: NavItem = { label: "Quick Fees", href: "/fees/quick", icon: Zap };
const FEES_TYPE: NavItem = { label: "Fees Type", href: "/fees/types", icon: Tag };
const FEES_DISCOUNT: NavItem = { label: "Fees Discount", href: "/fees/discounts", icon: Percent };
const FEES_CARRY_FORWARD: NavItem = { label: "Fees Carry Forward", href: "/fees/carry-forward", icon: CornerDownRight };
const FEES_REMINDER: NavItem = { label: "Fees Reminder", href: "/fees/reminders", icon: BellRing };
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
// Order here is the mobile order — new fee sub-pages are appended at the
// end so they don't shift which 4 items mobile shows.
export const NAV_ITEMS: NavItem[] = [
  COMMAND_CENTER,
  COLLECT_FEES,
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
  SEARCH_FEES_PAYMENT,
  SEARCH_DUE_FEES,
  QUICK_FEES,
  FEES_TYPE,
  FEES_DISCOUNT,
  FEES_CARRY_FORWARD,
  FEES_REMINDER,
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
  {
    label: "Fees Collection",
    items: [
      COLLECT_FEES,
      SEARCH_FEES_PAYMENT,
      SEARCH_DUE_FEES,
      QUICK_FEES,
      FEES_TYPE,
      FEES_DISCOUNT,
      FEES_CARRY_FORWARD,
      FEES_REMINDER,
    ],
  },
  { label: "Finance", items: [EXPENSES, SALARY, CASH_BOOK, LEDGER] },
  { label: "Students", items: [STUDENTS, CLASSES] },
  { label: "Reports", items: [REPORTS, ANALYTICS] },
  { label: "Others", items: [BILLS, AUDIT_LOG, SETTINGS] },
];
