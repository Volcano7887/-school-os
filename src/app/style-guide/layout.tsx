import { AppShell } from "@/components/shared/app-shell";

const DEMO_SCHOOLS = [
  { id: "1", name: "Boys School", slug: "demo", role: "school_admin" as const },
  { id: "2", name: "Girls School", slug: "demo-girls", role: "accountant" as const },
];

export default function StyleGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      schools={DEMO_SCHOOLS}
      activeSlug="demo"
      userName="Demo Accountant"
      userEmail="demo@example.com"
      userRole="accountant"
      dailyFeeTarget={3500000}
      todayCollection={2750000}
    >
      {children}
    </AppShell>
  );
}
