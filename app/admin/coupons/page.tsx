import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addCoupon, toggleCoupon } from "./actions";

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function CouponsPage({ searchParams }: PageProps) {
  const profile = await requireProfile(["admin", "super_admin"]);
  const params = await searchParams;
  const supabase = await createClient();

  const { data: coupons, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AppShell profile={profile}>
      <header className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b48a45]">
          Promotions
        </p>
        <h2 className="text-3xl font-bold">Coupons</h2>
      </header>

      {params.success && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {params.success}
        </div>
      )}
      {params.error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {params.error}
        </div>
      )}

      <section className="grid gap-5 2xl:grid-cols-[400px_1fr]">
        <form
          action={addCoupon}
          className="h-fit rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-sm"
        >
          <h3 className="text-lg font-bold">Create coupon</h3>

          <label className="mt-4 block text-sm font-semibold">Coupon code</label>
          <input
            name="code"
            required
            placeholder="WELCOME10"
            className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 uppercase outline-none focus:border-[#3b2418]"
          />

          <label className="mt-4 block text-sm font-semibold">Display name</label>
          <input
            name="name"
            required
            placeholder="Welcome Discount"
            className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              Discount type
              <select
                name="discount_type"
                className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-3 py-3"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>

            <label className="block text-sm font-semibold">
              Discount value
              <input
                name="discount_value"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="10"
                className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-3 py-3"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              Minimum bill
              <input
                name="minimum_order"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-3 py-3"
              />
            </label>

            <label className="block text-sm font-semibold">
              Maximum discount
              <input
                name="maximum_discount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Optional"
                className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-3 py-3"
              />
            </label>
          </div>

          <SubmitButton
            idleLabel="Create Coupon"
            pendingLabel="Creating Coupon..."
            className="mt-5 w-full rounded-2xl bg-[#3b2418] py-3 font-bold text-white"
          />
        </form>

        <div className="space-y-3">
          {error && (
            <p className="rounded-2xl bg-red-50 p-4 text-red-700">
              {error.message}
            </p>
          )}

          {coupons?.map((coupon) => (
            <article
              key={coupon.id}
              className="flex flex-col gap-4 rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-[#3b2418] px-3 py-1 text-sm font-bold text-white">
                    {coupon.code}
                  </span>
                  <span className={coupon.is_active ? "text-green-700" : "text-gray-500"}>
                    {coupon.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-3 font-bold">{coupon.name}</p>
                <p className="mt-1 text-sm text-[#806b5e]">
                  {coupon.discount_type === "percentage"
                    ? `${Number(coupon.discount_value)}% off`
                    : `₹${Number(coupon.discount_value)} off`}
                  {" · "}Minimum bill ₹{Number(coupon.minimum_order)}
                  {coupon.maximum_discount
                    ? ` · Maximum discount ₹${Number(coupon.maximum_discount)}`
                    : ""}
                </p>
              </div>

              <form action={toggleCoupon}>
                <input type="hidden" name="id" value={coupon.id} />
                <input
                  type="hidden"
                  name="is_active"
                  value={String(coupon.is_active)}
                />
                <SubmitButton
                  idleLabel={coupon.is_active ? "Disable" : "Enable"}
                  pendingLabel="Updating..."
                  className="rounded-xl border border-[#d9c8b3] bg-white px-4 py-2 text-sm font-bold"
                />
              </form>
            </article>
          ))}

          {!coupons?.length && !error && (
            <div className="rounded-3xl border border-dashed border-[#d9c8b3] p-10 text-center">
              No coupons have been created.
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
