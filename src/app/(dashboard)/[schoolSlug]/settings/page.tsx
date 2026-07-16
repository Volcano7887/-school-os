import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile, getSchoolMembers, getUserRole } from "@/lib/school/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { SettingsForm } from "./settings-form";
import { MembersSection } from "./members-section";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const school = await getSchoolProfile(supabase, schoolId);
  if (!school) notFound();

  const userRole = user ? await getUserRole(supabase, user.id, schoolId) : null;
  const isAdmin = userRole === "school_admin";
  const members = isAdmin ? await getSchoolMembers(supabase, schoolId) : [];

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: `/${schoolSlug}/dashboard` },
          { label: "Settings" },
        ]}
      />
      <h1 className="text-xl font-semibold">Settings</h1>
      <SettingsForm schoolSlug={schoolSlug} school={school} />
      {isAdmin && user && (
        <MembersSection schoolSlug={schoolSlug} members={members} currentUserId={user.id} />
      )}
    </div>
  );
}
