import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

const ALLOWED_ACTIONS = ["mark_paid", "mark_ready", "mark_completed", "mark_invalid", "mark_valid"] as const;
type Action = (typeof ALLOWED_ACTIONS)[number];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", id).single();
  if (orderError || !order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id).order("created_at");

  let couponName: string | null = null;
  if (order.coupon_id) {
    const { data: coupon } = await supabase.from("coupons").select("name").eq("id", order.coupon_id).maybeSingle();
    couponName = coupon?.name ?? null;
  }

  return NextResponse.json({ order: { ...order, coupon_name: couponName }, items: items ?? [] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action as Action | undefined;

  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const updates: Record<string, unknown> =
    action === "mark_paid"
      ? { is_paid: true, status: "preparing", paid_at: now }
      : action === "mark_ready"
      ? { status: "ready", ready_at: now }
      : action === "mark_completed"
      ? { status: "completed", completed_at: now }
      : action === "mark_invalid"
      ? { is_invalid: true }
      : { is_invalid: false };

  const { error } = await supabase.from("orders").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not update order." }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("customer_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: "Could not find order." }, { status: 500 });

  // order_items cascade-delete automatically via the FK.
  const { error: deleteError } = await supabase.from("orders").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: "Could not delete order." }, { status: 500 });

  // Keep the loyalty milestone accurate — this order no longer counts.
  if (order?.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("order_count")
      .eq("id", order.customer_id)
      .maybeSingle();
    if (customer) {
      await supabase
        .from("customers")
        .update({ order_count: Math.max(0, customer.order_count - 1) })
        .eq("id", order.customer_id);
    }
  }

  return NextResponse.json({ ok: true });
}
