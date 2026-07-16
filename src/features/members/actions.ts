"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSchoolIdBySlug, getUserRole } from "@/lib/school/queries";
import { addMemberSchema } from "@/features/members/schema";
import type { ActionState } from "@/lib/types/action-state";
import type { SchoolRole } from "@/types/database.types";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function addMember(
  schoolSlug: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = addMemberSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const callerRole = await getUserRole(supabase, user.id, schoolId);
  if (callerRole !== "school_admin") {
    return { status: "error", message: "Only an Admin can add members." };
  }

  const { email, fullName, role } = parsed.data;

  const { data: existingUserId } = await supabase.rpc("get_user_id_by_email", {
    p_email: email,
  });

  let userId: string | null = existingUserId ?? null;
  let tempPassword: string | null = null;

  if (!userId) {
    let admin;
    try {
      admin = createAdminClient();
    } catch (err) {
      return {
        status: "error",
        message: err instanceof Error ? err.message : "Admin client is not configured.",
      };
    }

    tempPassword = generateTempPassword();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created.user) {
      return { status: "error", message: createError?.message ?? "Couldn't create the account." };
    }
    userId = created.user.id;
  }

  const { error: membershipError } = await supabase
    .from("school_users")
    .upsert(
      { school_id: schoolId, user_id: userId, role, is_active: true },
      { onConflict: "school_id,user_id" }
    );

  if (membershipError) {
    return { status: "error", message: "Couldn't add this member to the school." };
  }

  revalidatePath(`/${schoolSlug}/settings`);
  return {
    status: "success",
    message: tempPassword ? "Account created." : "Existing account added to this school.",
    data: tempPassword ? { tempPassword, email } : undefined,
  };
}

export async function updateMemberRole(
  schoolSlug: string,
  userId: string,
  role: SchoolRole
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const callerRole = await getUserRole(supabase, user.id, schoolId);
  if (callerRole !== "school_admin") {
    return { status: "error", message: "Only an Admin can change roles." };
  }

  if (userId === user.id) {
    return { status: "error", message: "You can't change your own role." };
  }

  const { error } = await supabase
    .from("school_users")
    .update({ role })
    .eq("school_id", schoolId)
    .eq("user_id", userId);

  if (error) return { status: "error", message: "Couldn't update the role." };

  revalidatePath(`/${schoolSlug}/settings`);
  return { status: "success" };
}

export async function removeMember(schoolSlug: string, userId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const callerRole = await getUserRole(supabase, user.id, schoolId);
  if (callerRole !== "school_admin") {
    return { status: "error", message: "Only an Admin can remove members." };
  }

  if (userId === user.id) {
    return { status: "error", message: "You can't remove yourself." };
  }

  const { error } = await supabase
    .from("school_users")
    .delete()
    .eq("school_id", schoolId)
    .eq("user_id", userId);

  if (error) return { status: "error", message: "Couldn't remove this member." };

  revalidatePath(`/${schoolSlug}/settings`);
  return { status: "success" };
}
