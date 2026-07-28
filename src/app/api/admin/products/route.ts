import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const categoryId = String(body?.categoryId ?? "");
  const price = Number(body?.price);

  if (!name || !categoryId || !Number.isFinite(price)) {
    return NextResponse.json({ error: "Name, category and price are required." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      category_id: categoryId,
      price,
      description: body?.description ? String(body.description) : null,
      gst_rate: body?.gstRate != null ? Number(body.gstRate) : 5,
      image_url: body?.imageUrl ? String(body.imageUrl) : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Could not create item." }, { status: 500 });
  return NextResponse.json({ product: data });
}
