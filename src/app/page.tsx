import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserSchools } from "@/lib/school/queries";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const schools = await getUserSchools(supabase, user.id);

  if (schools.length === 0) redirect("/onboarding");

  redirect(`/${schools[0].slug}/dashboard`);
}
