import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { computeTaxBreakup, sumTaxBreakups } from "@/lib/tax";

function rangeStart(range: string): Date {
  const now = new Date();
  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "month") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "today";
  const since = rangeStart(range).toISOString();

  const supabase = createServiceClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("is_paid", true)
    .gte("created_at", since);

  if (error) return NextResponse.json({ error: "Could not load report." }, { status: 500 });

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: items } = orderIds.length
    ? await supabase.from("order_items").select("*").in("order_id", orderIds)
    : { data: [] };

  const deliveryChargesCollected = (orders ?? []).reduce((s, o) => s + Number(o.delivery_charge ?? 0), 0);
  const grossSales = (orders ?? []).reduce((s, o) => s + Number(o.subtotal), 0) + deliveryChargesCollected;
  const ordersCount = (orders ?? []).length;
  const avgOrderValue = ordersCount ? grossSales / ordersCount : 0;
  const rewardsGiven = (orders ?? []).filter((o) => o.reward_applied === "free_dish").length;
  const discountsGiven = (orders ?? []).reduce((s, o) => s + Number(o.discount_amount ?? 0), 0);
  const posOrdersCount = (orders ?? []).filter((o) => o.source === "pos").length;
  const webOrdersCount = ordersCount - posOrdersCount;
  const deliveryOrdersCount = (orders ?? []).filter((o) => o.order_type === "delivery").length;

  const taxBreakup = sumTaxBreakups(
    (items ?? []).map((i) => computeTaxBreakup(Number(i.line_total), Number(i.gst_rate)))
  );

  const qtyByProduct = new Map<string, number>();
  for (const i of items ?? []) {
    qtyByProduct.set(i.product_name, (qtyByProduct.get(i.product_name) ?? 0) + i.quantity);
  }
  const topItems = [...qtyByProduct.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  return NextResponse.json({
    range,
    grossSales,
    ordersCount,
    avgOrderValue,
    rewardsGiven,
    discountsGiven,
    posOrdersCount,
    webOrdersCount,
    deliveryOrdersCount,
    deliveryChargesCollected,
    taxBreakup,
    topItems,
  });
}
