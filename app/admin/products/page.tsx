import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addProduct, toggleProduct } from "./actions";

export default async function ProductsPage() {
  const profile = await requireProfile(["admin", "super_admin"]);
  const supabase = await createClient();

  const [{ data: categories }, { data: products, error }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("products")
      .select("id, name, price, is_active, is_topping, categories(name)")
      .order("name"),
  ]);

  return (
    <AppShell profile={profile}>
      <header className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b48a45]">
          Menu Management
        </p>
        <h2 className="text-3xl font-bold">Products</h2>
      </header>

      <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <form
          action={addProduct}
          className="h-fit rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5"
        >
          <h3 className="text-lg font-bold">Add product</h3>

          <label className="mt-4 block text-sm font-semibold">Product name</label>
          <input
            name="name"
            required
            autoComplete="off"
            placeholder="Example: Chocolate Waffle"
            className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]"
          />

          <label className="mt-4 block text-sm font-semibold">Category</label>
          <select
            name="category_id"
            required
            className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]"
          >
            <option value="">Select category</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-semibold">Selling price</label>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="179"
            className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]"
          />

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[#eadfcf] bg-white p-3 text-sm font-medium">
            <input type="checkbox" name="is_topping" />
            This product is a topping
          </label>

          <SubmitButton
            idleLabel="Add Product"
            pendingLabel="Adding Product..."
            className="mt-4 w-full rounded-2xl bg-[#3b2418] py-3 font-bold text-white"
          />
        </form>

        <div className="rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5">
          {error && <p className="text-red-700">{error.message}</p>}

          <div className="space-y-3">
            {products?.map((product) => {
              const category = Array.isArray(product.categories)
                ? product.categories[0]?.name
                : (product.categories as { name?: string } | null)?.name;

              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[#eadfcf] bg-white p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{product.name}</p>
                      {product.is_topping && (
                        <span className="rounded-full bg-[#fff1d8] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#9a671e]">
                          Topping
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#806b5e]">
                      {category ?? "Uncategorised"} · ₹{Number(product.price)}
                    </p>
                  </div>

                  <form action={toggleProduct}>
                    <input type="hidden" name="id" value={product.id} />
                    <input
                      type="hidden"
                      name="is_active"
                      value={String(product.is_active)}
                    />
                    <SubmitButton
                      idleLabel={product.is_active ? "Disable" : "Enable"}
                      pendingLabel="Updating..."
                      className="rounded-xl border border-[#d9c8b3] px-4 py-2 text-sm font-semibold"
                    />
                  </form>
                </div>
              );
            })}

            {!products?.length && (
              <p className="rounded-2xl border border-dashed p-8 text-center">
                No products have been added.
              </p>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
