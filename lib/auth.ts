import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/auth";

export async function requireProfile(
  allowedRoles?: UserRole[]
): Promise<Profile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (error || !profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  if (allowedRoles && !allowedRoles.includes(profile.role as UserRole)) {
    redirect("/pos?error=not-authorized");
  }

  return profile as Profile;
}
