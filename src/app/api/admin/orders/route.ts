import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .neq("status", "completed")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Could not load orders." }, { status: 500 });

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: items } = orderIds.length
    ? await supabase.from("order_items").select("*").in("order_id", orderIds)
    : { data: [] };

  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const result = (orders ?? []).map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] }));
  return NextResponse.json({ orders: result });
}
