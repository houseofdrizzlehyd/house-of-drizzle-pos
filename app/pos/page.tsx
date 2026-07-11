import { AppShell } from "@/components/app-shell";
import { PosScreen } from "@/components/pos-screen";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Coupon, Product } from "@/types/pos";
import { defaultBillSettings, type BillSettings } from "@/types/bill-settings";
import { defaultTaxSettings, type TaxSettings } from "@/types/tax-settings";

export default async function PosPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [
    { data: productData, error: productError },
    { data: couponData },
    { data: settingsData },
    { data: taxSettingsData },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, is_topping, categories(name)")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("coupons")
      .select(
        "id, code, name, discount_type, discount_value, minimum_order, maximum_discount"
      )
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order("code"),
supabase
  .from("bill_settings")
  .select("*")
  .eq("id", 1)
  .maybeSingle(),

supabase
  .from("tax_settings")
  .select("*")
  .eq("id", 1)
  .maybeSingle(),
]);

  const products: Product[] =
    productData?.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      isTopping: Boolean(item.is_topping),
      category: Array.isArray(item.categories)
        ? item.categories[0]?.name ?? "Uncategorised"
        : (item.categories as { name?: string } | null)?.name ??
          "Uncategorised",
    })) ?? [];

  const coupons: Coupon[] =
    couponData?.map((coupon) => ({
      ...coupon,
      discount_value: Number(coupon.discount_value),
      minimum_order: Number(coupon.minimum_order),
      maximum_discount:
        coupon.maximum_discount === null
          ? null
          : Number(coupon.maximum_discount),
    })) ?? [];

  const billSettings: BillSettings = settingsData
    ? ({
        ...defaultBillSettings,
        ...settingsData,
        paper_width: Number(settingsData.paper_width) as 58 | 80,
      } as BillSettings)
    : defaultBillSettings;

  const taxSettings: TaxSettings = taxSettingsData ? {...defaultTaxSettings,...taxSettingsData,gst_rate:Number(taxSettingsData.gst_rate)} : defaultTaxSettings;

  return (
    <AppShell profile={profile}>
      {productError && (
        <p className="mb-4 rounded-2xl bg-red-50 p-4 text-red-700">
          Products could not be loaded: {productError.message}
        </p>
      )}

      <PosScreen
        products={products.filter((product) => !product.isTopping)}
        toppings={products.filter((product) => product.isTopping)}
        coupons={coupons}
        billSettings={billSettings}
        taxSettings={taxSettings}
      />
    </AppShell>
  );
}
