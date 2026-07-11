import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addCategory, toggleCategory } from "./actions";

export default async function CategoriesPage() {
  const profile = await requireProfile(["admin", "super_admin"]);
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, display_order, is_active")
    .order("display_order")
    .order("name");

  return (
    <AppShell profile={profile}>
      <header className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b48a45]">Menu Management</p>
        <h2 className="text-3xl font-bold">Categories</h2>
      </header>

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <form action={addCategory} className="h-fit rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5">
          <h3 className="text-lg font-bold">Add category</h3>
          <input name="name" required autoComplete="off" placeholder="Example: Waffles" className="mt-4 w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]" />
          <SubmitButton idleLabel="Add Category" pendingLabel="Adding Category..." className="mt-3 w-full rounded-2xl bg-[#3b2418] py-3 font-bold text-white" />
        </form>

        <div className="rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5">
          {error && <p className="text-red-700">{error.message}</p>}
          <div className="space-y-3">
            {categories?.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-2xl border border-[#eadfcf] bg-white p-4">
                <div>
                  <p className="font-bold">{category.name}</p>
                  <p className="text-sm text-[#806b5e]">{category.is_active ? "Active" : "Inactive"}</p>
                </div>
                <form action={toggleCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="is_active" value={String(category.is_active)} />
                  <SubmitButton idleLabel={category.is_active ? "Disable" : "Enable"} pendingLabel="Updating..." className="rounded-xl border border-[#d9c8b3] px-4 py-2 text-sm font-semibold" />
                </form>
              </div>
            ))}
            {!categories?.length && <p className="rounded-2xl border border-dashed p-8 text-center">No categories have been added.</p>}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
