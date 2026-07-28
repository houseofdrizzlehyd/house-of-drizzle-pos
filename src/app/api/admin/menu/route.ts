import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const [{ data: categories }, { data: products }, { data: toppings }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("*").order("name"),
    supabase.from("toppings").select("*").order("name"),
  ]);

  const toppingsByProduct = new Map<string, typeof toppings>();
  for (const t of toppings ?? []) {
    const list = toppingsByProduct.get(t.product_id) ?? [];
    list.push(t);
    toppingsByProduct.set(t.product_id, list);
  }

  const productsWithToppings = (products ?? []).map((p) => ({
    ...p,
    toppings: toppingsByProduct.get(p.id) ?? [],
  }));

  return NextResponse.json({ categories: categories ?? [], products: productsWithToppings });
}
