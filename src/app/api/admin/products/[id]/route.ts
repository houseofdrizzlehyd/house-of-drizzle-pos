import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

const EDITABLE_FIELDS = [
  "name",
  "description",
  "price",
  "gst_rate",
  "image_url",
  "is_available",
  "is_todays_special",
  "is_must_try",
  "is_reward_dish",
  "category_id",
] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No editable fields provided." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: "Could not update item." }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not delete item." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
