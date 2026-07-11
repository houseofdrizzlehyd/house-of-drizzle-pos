"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/auth";

const allowedRoles: UserRole[] = ["biller", "admin", "super_admin"];

function staffRedirect(message: string, type: "success" | "error") {
  redirect(`/admin/staff?${type}=${encodeURIComponent(message)}`);
}

export async function createStaff(formData: FormData) {
  await requireProfile(["super_admin"]);

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!fullName || !email || !password || !allowedRoles.includes(role)) {
    staffRedirect("Complete all required fields.", "error");
  }
  if (password.length < 8) {
    staffRedirect("Password must contain at least 8 characters.", "error");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    staffRedirect(error?.message ?? "Unable to create staff account.", "error");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      role,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.user.id);

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    staffRedirect(profileError.message, "error");
  }

  revalidatePath("/admin/staff");
  staffRedirect(`${fullName} was created as ${role.replace("_", " ")}.`, "success");
}

export async function updateStaffRole(formData: FormData) {
  const currentProfile = await requireProfile(["super_admin"]);
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!id || !allowedRoles.includes(role)) {
    staffRedirect("Invalid staff role.", "error");
  }
  if (id === currentProfile.id && role !== "super_admin") {
    staffRedirect("You cannot remove your own super-admin access.", "error");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) staffRedirect(error.message, "error");
  revalidatePath("/admin/staff");
  staffRedirect("Staff role updated.", "success");
}

export async function toggleStaffStatus(formData: FormData) {
  const currentProfile = await requireProfile(["super_admin"]);
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active")) === "true";

  if (!id) staffRedirect("Invalid staff account.", "error");
  if (id === currentProfile.id) {
    staffRedirect("You cannot deactivate your own account.", "error");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_active: !isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) staffRedirect(error.message, "error");
  revalidatePath("/admin/staff");
  staffRedirect(isActive ? "Staff account deactivated." : "Staff account activated.", "success");
}

export async function resetStaffPassword(formData: FormData) {
  await requireProfile(["super_admin"]);
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!id || password.length < 8) {
    staffRedirect("New password must contain at least 8 characters.", "error");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) staffRedirect(error.message, "error");
  staffRedirect("Password updated successfully.", "success");
}
