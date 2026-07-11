"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function addProduct(formData: FormData) {
  await requireProfile(["admin", "super_admin"]);

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const price = Number(formData.get("price"));
  const isTopping = formData.get("is_topping") === "on";

  if (!name || !categoryId || !Number.isFinite(price) || price < 0) {
    return;
  }

  const supabase = await createClient();

  const { error } = await supabase.from("products").insert({
    name,
    category_id: categoryId,
    price,
    is_topping: isTopping,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/pos");
}

export async function toggleProduct(formData: FormData) {
  await requireProfile(["admin", "super_admin"]);

  const id = String(formData.get("id"));
  const isActive = String(formData.get("is_active")) === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/pos");
}
