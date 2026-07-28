import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Category name is required." }, { status: 400 });

  const supabase = createServiceClient();
  const { data: existing } = await supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const nextSort = (existing?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, sort_order: nextSort })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Could not create category." }, { status: 500 });
  return NextResponse.json({ category: data });
}
