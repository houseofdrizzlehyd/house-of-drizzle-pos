import { createServiceClient } from "@/lib/supabase/server";
import { OrderStatusClient } from "@/components/OrderStatusClient";
import { notFound } from "next/navigation";
import type { Order, OrderItem } from "@/lib/types";

export const revalidate = 0;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).single(),
    supabase.from("order_items").select("*").eq("order_id", id).order("created_at"),
  ]);

  if (!order) return notFound();

  return (
    <OrderStatusClient
      orderId={id}
      initialOrder={order as Order}
      initialItems={(items ?? []) as OrderItem[]}
    />
  );
}
