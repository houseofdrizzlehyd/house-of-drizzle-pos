import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

const KEYS = ["delivery_minimum_order_amount", "delivery_charge_amount", "delivery_radius_km"] as const;

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data } = await supabase.from("settings").select("key, value").in("key", KEYS);
  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]));

  return NextResponse.json({
    deliveryMinimumOrderAmount: Number(byKey.get("delivery_minimum_order_amount") ?? 200) || 200,
    deliveryChargeAmount: Number(byKey.get("delivery_charge_amount") ?? 0) || 0,
    deliveryRadiusKm: Number(byKey.get("delivery_radius_km") ?? 5) || 5,
  });
}

export async function PATCH(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const updates: { key: string; value: number }[] = [];

  if ("deliveryMinimumOrderAmount" in body) {
    const value = Number(body.deliveryMinimumOrderAmount);
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json({ error: "Minimum order amount must be a non-negative number." }, { status: 400 });
    }
    updates.push({ key: "delivery_minimum_order_amount", value });
  }

  if ("deliveryChargeAmount" in body) {
    const value = Number(body.deliveryChargeAmount);
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json({ error: "Delivery charge must be a non-negative number." }, { status: 400 });
    }
    updates.push({ key: "delivery_charge_amount", value });
  }

  if ("deliveryRadiusKm" in body) {
    const value = Number(body.deliveryRadiusKm);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Delivery radius must be a positive number." }, { status: 400 });
    }
    updates.push({ key: "delivery_radius_km", value });
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No editable fields provided." }, { status: 400 });
  }

  const supabase = createServiceClient();
  for (const { key, value } of updates) {
    const { error } = await supabase.from("settings").upsert({ key, value });
    if (error) return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
