import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: category }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").eq("id", id).single(),
    supabase.from("products").select("*").eq("category_id", id).order("name"),
  ]);

  return (
    <div className="pb-8">
      <div className="bg-chocolate px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-cream text-sm">&larr;</Link>
        <span className="text-cream text-sm font-medium">{category?.name ?? "Menu"}</span>
      </div>
      <div className="px-4 pt-4 grid grid-cols-2 gap-2.5">
        {((products ?? []) as Product[]).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {(products ?? []).length === 0 && (
          <div className="col-span-2 text-sm text-mocha text-center pt-8">No items in this category yet.</div>
        )}
      </div>
    </div>
  );
}
