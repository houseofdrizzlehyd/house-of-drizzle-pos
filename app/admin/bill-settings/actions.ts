"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function go(message: string, type: "success" | "error") {
  redirect(`/admin/bill-settings?${type}=${encodeURIComponent(message)}`);
}

function checkbox(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

export async function saveBillSettings(formData: FormData) {
  const profile = await requireProfile(["admin", "super_admin"]);
  const supabase = await createClient();

  const businessName = String(formData.get("business_name") ?? "").trim();
  const headerAlignment = String(formData.get("header_alignment") ?? "center");
  const receiptFontSize = String(formData.get("receipt_font_size") ?? "medium");
  const dividerStyle = String(formData.get("divider_style") ?? "dashed");
  const paperWidth = Number(formData.get("paper_width") ?? 80);

  if (!businessName) {
    go("Business name is required.", "error");
  }

  if (!["left", "center", "right"].includes(headerAlignment)) {
    go("Invalid header alignment.", "error");
  }

  if (!["small", "medium", "large"].includes(receiptFontSize)) {
    go("Invalid receipt font size.", "error");
  }

  if (!["dashed", "solid", "none"].includes(dividerStyle)) {
    go("Invalid divider style.", "error");
  }

  if (![58, 80].includes(paperWidth)) {
    go("Paper width must be 58 mm or 80 mm.", "error");
  }

  let logoDataUrl: string | null | undefined;
  const logo = formData.get("logo");

  if (logo instanceof File && logo.size > 0) {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(logo.type)) {
      go("Logo must be PNG, JPG or WebP.", "error");
    }

    if (logo.size > 500 * 1024) {
      go("Logo file must be smaller than 500 KB.", "error");
    }

    const buffer = Buffer.from(await logo.arrayBuffer());
    logoDataUrl = `data:${logo.type};base64,${buffer.toString("base64")}`;
  }

  if (formData.get("remove_logo") === "on") {
    logoDataUrl = null;
  }

  const settings = {
    id: 1,
    business_name: businessName,
    tagline: String(formData.get("tagline") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    gst_number: String(formData.get("gst_number") ?? "").trim().toUpperCase() || null,
    footer_message: String(formData.get("footer_message") ?? "").trim() || null,
    show_logo: checkbox(formData, "show_logo"),
    show_tagline: checkbox(formData, "show_tagline"),
    show_address: checkbox(formData, "show_address"),
    show_phone: checkbox(formData, "show_phone"),
    show_gst: checkbox(formData, "show_gst"),
    show_customer_name: checkbox(formData, "show_customer_name"),
    show_customer_phone: checkbox(formData, "show_customer_phone"),
    show_coupon: checkbox(formData, "show_coupon"),
    show_payment_method: checkbox(formData, "show_payment_method"),
    show_item_rate: checkbox(formData, "show_item_rate"),
    header_alignment: headerAlignment,
    receipt_font_size: receiptFontSize,
    divider_style: dividerStyle,
    paper_width: paperWidth,
    updated_by: profile.id,
    updated_at: new Date().toISOString(),
    ...(logoDataUrl !== undefined ? { logo_data_url: logoDataUrl } : {}),
  };

  const { error } = await supabase
    .from("bill_settings")
    .upsert(settings, { onConflict: "id" });

  if (error) {
    go(error.message, "error");
  }

  revalidatePath("/admin/bill-settings");
  revalidatePath("/pos");
  go("Bill settings saved successfully.", "success");
}
