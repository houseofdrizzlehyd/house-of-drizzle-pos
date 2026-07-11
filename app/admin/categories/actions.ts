"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function addCategory(formData: FormData) {
  await requireProfile(["admin", "super_admin"]);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/pos");
}

export async function toggleCategory(formData: FormData) {
  await requireProfile(["admin", "super_admin"]);

  const id = String(formData.get("id"));
  const isActive = String(formData.get("is_active")) === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/pos");
}
