import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

const ALLOWED_ACTIONS = ["mark_paid", "mark_ready", "mark_completed"] as const;
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
      : { status: "completed", completed_at: now };

  const { error } = await supabase.from("orders").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not update order." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
