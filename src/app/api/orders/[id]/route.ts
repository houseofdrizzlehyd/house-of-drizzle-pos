import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: order, error }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).single(),
    supabase.from("order_items").select("*").eq("order_id", id).order("created_at"),
  ]);

  if (error || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order, items: items ?? [] });
}
