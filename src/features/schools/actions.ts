"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slugify";
import { createSchoolSchema } from "@/features/schools/schema";
import { DEFAULT_LEDGER_ACCOUNTS } from "@/lib/accounting/default-accounts";
import type { ActionState } from "@/lib/types/action-state";

const UNIQUE_VIOLATION = "23505";

export async function createSchool(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createSchoolSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const baseSlug = slugify(parsed.data.name) || "school";
  let slug = baseSlug;
  let school: { id: string; slug: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("schools")
      .insert({
        name: parsed.data.name,
        slug,
        address: parsed.data.address || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        created_by: user.id,
      })
      .select("id, slug")
      .single();

    if (!error && data) {
      school = data;
      break;
    }

    if (error?.code === UNIQUE_VIOLATION) {
      slug = `${baseSlug}-${attempt + 2}`;
      continue;
    }

    return { status: "error", message: "Couldn't create the school. Please try again." };
  }

  if (!school) {
    return { status: "error", message: "Couldn't create the school. Please try again." };
  }

  const { error: membershipError } = await supabase.from("school_users").insert({
    school_id: school.id,
    user_id: user.id,
    role: "school_admin",
  });

  if (membershipError) {
    return {
      status: "error",
      message: "School was created, but adding you as its admin failed. Contact support.",
    };
  }

  // Seed the default chart of accounts so Fee Collection can post journal
  // entries from day one — not fatal if it fails, Fee Collection re-checks.
  await supabase.from("ledger_accounts").insert(
    DEFAULT_LEDGER_ACCOUNTS.map((account) => ({
      school_id: school.id,
      code: account.code,
      name: account.name,
      type: account.type,
      is_system: true,
    }))
  );

  redirect(`/${school.slug}/dashboard`);
}
