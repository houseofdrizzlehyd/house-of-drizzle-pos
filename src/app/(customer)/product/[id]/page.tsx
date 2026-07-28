import { createClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import type { Product, Topping } from "@/lib/types";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: toppings }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("toppings").select("*").eq("product_id", id).order("name"),
  ]);

  if (!product) return notFound();

  return (
    <ProductDetailClient
      product={product as Product}
      toppings={(toppings ?? []) as Topping[]}
    />
  );
}
