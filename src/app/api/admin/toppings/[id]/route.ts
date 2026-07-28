import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("toppings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not remove topping." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
