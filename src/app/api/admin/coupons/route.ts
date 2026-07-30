import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load coupons." }, { status: 500 });
  return NextResponse.json({ coupons: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const discountPercent = Number(body?.discountPercent);

  if (!name || !Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
    return NextResponse.json(
      { error: "Name and a discount percent between 1 and 100 are required." },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      name,
      discount_percent: discountPercent,
      show_on_pos: Boolean(body?.showOnPos),
      show_on_web: Boolean(body?.showOnWeb),
      is_active: body?.isActive != null ? Boolean(body.isActive) : true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Could not create coupon." }, { status: 500 });
  return NextResponse.json({ coupon: data });
}
