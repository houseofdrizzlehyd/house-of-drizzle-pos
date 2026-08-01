import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

// The store operates in India, which has no DST — a fixed +05:30 offset is
// always correct for turning a "YYYY-MM-DD" day into UTC query bounds.
const IST_OFFSET = "+05:30";

function istDayBounds(dateStr: string): { start: string; end: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const start = new Date(`${dateStr}T00:00:00${IST_OFFSET}`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const supabase = createServiceClient();
  let query = supabase.from("orders").select("*");

  if (date) {
    // Day history view: every order that day, any status, including
    // invalid ones (so staff can review/undo), newest first.
    const bounds = istDayBounds(date);
    if (!bounds) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    query = query.gte("created_at", bounds.start).lt("created_at", bounds.end).order("created_at", { ascending: false });
  } else {
    // Live queue: only orders still in progress, invalid ones hidden.
    query = query.neq("status", "completed").eq("is_invalid", false).order("created_at", { ascending: true });
  }

  const { data: orders, error } = await query;

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
