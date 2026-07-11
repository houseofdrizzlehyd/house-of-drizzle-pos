"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function go(message: string, type: "success" | "error") {
  redirect(`/admin/coupons?${type}=${encodeURIComponent(message)}`);
}

export async function addCoupon(formData: FormData) {
  const profile = await requireProfile(["admin", "super_admin"]);

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const discountType = String(formData.get("discount_type") ?? "");
  const discountValue = Number(formData.get("discount_value"));
  const minimumOrder = Number(formData.get("minimum_order") || 0);
  const maxValue = String(formData.get("maximum_discount") ?? "").trim();
  const maximumDiscount = maxValue ? Number(maxValue) : null;

  if (
    !code ||
    !name ||
    !["percentage", "fixed"].includes(discountType) ||
    !Number.isFinite(discountValue) ||
    discountValue <= 0 ||
    !Number.isFinite(minimumOrder) ||
    minimumOrder < 0
  ) {
    go("Please enter valid coupon details.", "error");
  }

  if (discountType === "percentage" && discountValue > 100) {
    go("Percentage discount cannot exceed 100%.", "error");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").insert({
    code,
    name,
    discount_type: discountType,
    discount_value: discountValue,
    minimum_order: minimumOrder,
    maximum_discount: maximumDiscount,
    created_by: profile.id,
  });

  if (error) {
    go(error.message, "error");
  }

  revalidatePath("/admin/coupons");
  revalidatePath("/pos");
  go(`${code} coupon created.`, "success");
}

export async function toggleCoupon(formData: FormData) {
  await requireProfile(["admin", "super_admin"]);

  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active")) === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("coupons")
    .update({
      is_active: !isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    go(error.message, "error");
  }

  revalidatePath("/admin/coupons");
  revalidatePath("/pos");
  go(isActive ? "Coupon disabled." : "Coupon enabled.", "success");
}
