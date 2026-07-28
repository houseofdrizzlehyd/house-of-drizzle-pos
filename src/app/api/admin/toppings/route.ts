import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const productId = String(body?.productId ?? "");
  const name = String(body?.name ?? "").trim();
  const price = Number(body?.price ?? 0);

  if (!productId || !name) {
    return NextResponse.json({ error: "Product and topping name are required." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("toppings")
    .insert({ product_id: productId, name, price })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Could not add topping." }, { status: 500 });
  return NextResponse.json({ topping: data });
}
