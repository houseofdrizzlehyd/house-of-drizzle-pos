import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Public-facing, but only ever exposes active coupons matching the
// requested channel — never the full admin coupon record.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");
  const column = channel === "pos" ? "show_on_pos" : "show_on_web";

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("id, name, discount_percent")
    .eq("is_active", true)
    .eq(column, true)
    .order("name");

  if (error) return NextResponse.json({ error: "Could not load coupons." }, { status: 500 });
  return NextResponse.json({ coupons: data ?? [] });
}
