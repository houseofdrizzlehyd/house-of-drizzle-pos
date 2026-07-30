import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

const EDITABLE_FIELDS: Record<string, string> = {
  name: "name",
  discountPercent: "discount_percent",
  isActive: "is_active",
  showOnPos: "show_on_pos",
  showOnWeb: "show_on_web",
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(EDITABLE_FIELDS)) {
    if (key in body) updates[column] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No editable fields provided." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("coupons").update(updates).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: "Could not update coupon." }, { status: 500 });
  return NextResponse.json({ coupon: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not delete coupon." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
