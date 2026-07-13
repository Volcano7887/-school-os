import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserSchools } from "@/lib/school/queries";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const schools = await getUserSchools(supabase, user.id);

  return <OnboardingForm isFirstSchool={schools.length === 0} />;
}
