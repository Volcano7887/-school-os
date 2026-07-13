import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserSchools } from "@/lib/school/queries";
import { AppShell } from "@/components/shared/app-shell";

export default async function SchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already guarantees a session for every route under this
  // layout, but the type system doesn't know that.
  if (!user) redirect("/login");

  const schools = await getUserSchools(supabase, user.id);
  const activeSchool = schools.find((s) => s.slug === schoolSlug);

  // Not a member of this school (wrong slug, or no longer has access) —
  // send them to their real active school instead of a dead page.
  if (!activeSchool) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <AppShell
      schools={schools}
      activeSlug={schoolSlug}
      userName={profile?.full_name ?? user.email ?? "Account"}
      userEmail={user.email ?? ""}
      userRole={activeSchool.role}
    >
      {children}
    </AppShell>
  );
}
