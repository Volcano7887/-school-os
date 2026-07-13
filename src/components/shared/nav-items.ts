import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  Banknote,
  BookOpen,
  ScrollText,
  FileBarChart,
  Paperclip,
  History,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// First 4 show in the mobile bottom nav; everything else lives behind "More".
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Fees", href: "/fees", icon: Wallet },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Students", href: "/students", icon: Users },
  { label: "Salary", href: "/salary", icon: Banknote },
  { label: "Cash Book", href: "/cash-book", icon: BookOpen },
  { label: "Ledger", href: "/ledger", icon: ScrollText },
  { label: "Reports", href: "/reports", icon: FileBarChart },
  { label: "Bills", href: "/bills", icon: Paperclip },
  { label: "Audit Log", href: "/audit-log", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const MOBILE_PRIMARY_COUNT = 4;
