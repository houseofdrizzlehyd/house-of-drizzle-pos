import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "@/components/HomeClient";
import type { Category, Product } from "@/lib/types";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("products").select("*").eq("is_available", true).order("name"),
  ]);

  const allProducts = (products ?? []) as Product[];
  const specials = allProducts.filter((p) => p.is_todays_special);
  const mustTry = allProducts.filter((p) => p.is_must_try);

  return (
    <HomeClient
      categories={(categories ?? []) as Category[]}
      specials={specials}
      mustTry={mustTry}
      allProducts={allProducts}
    />
  );
}
