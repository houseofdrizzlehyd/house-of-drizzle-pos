import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Public — the checkout page needs these two values to validate and display
// the delivery minimum/charge without exposing the rest of the settings table.
export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["delivery_minimum_order_amount", "delivery_charge_amount"]);

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]));

  return NextResponse.json({
    minimumOrderAmount: Number(byKey.get("delivery_minimum_order_amount") ?? 200) || 200,
    deliveryCharge: Number(byKey.get("delivery_charge_amount") ?? 0) || 0,
  });
}
