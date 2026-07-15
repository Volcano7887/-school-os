import { SidebarNav } from "@/components/shared/sidebar-nav";
import { BottomNav } from "@/components/shared/bottom-nav";
import { Topbar } from "@/components/shared/topbar";
import { CommandPalette } from "@/components/shared/command-palette";
import type { UserSchool } from "@/lib/school/queries";

export function AppShell({
  schools,
  activeSlug,
  userName,
  userEmail,
  userRole,
  dailyFeeTarget,
  todayCollection,
  children,
}: {
  schools: UserSchool[];
  activeSlug: string;
  userName: string;
  userEmail: string;
  userRole: string;
  dailyFeeTarget: number | null;
  todayCollection: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <SidebarNav
        activeSlug={activeSlug}
        dailyFeeTarget={dailyFeeTarget}
        todayCollection={todayCollection}
      />
      <div className="flex flex-1 flex-col">
        <Topbar
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          schools={schools}
          activeSlug={activeSlug}
        />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav schools={schools} activeSlug={activeSlug} />
      <CommandPalette schoolSlug={activeSlug} />
    </div>
  );
}
