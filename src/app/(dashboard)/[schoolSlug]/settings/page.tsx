import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile } from "@/lib/school/queries";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const school = await getSchoolProfile(supabase, schoolId);
  if (!school) notFound();

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
    </div>
  );
}
