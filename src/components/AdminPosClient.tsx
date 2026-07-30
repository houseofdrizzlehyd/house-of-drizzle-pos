"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category, Product, Topping } from "@/lib/types";

type ProductWithToppings = Product & { toppings: Topping[] };
type CartLine = {
  key: string;
  product: ProductWithToppings;
  quantity: number;
  selectedToppings: Topping[];
};
type PosCoupon = { id: string; name: string; discount_percent: number };

function lineKey(productId: string, toppingIds: string[]) {
  return `${productId}::${[...toppingIds].sort().join(",")}`;
}

export function AdminPosClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithToppings[]>([]);
  const [query, setQuery] = useState("");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [coupons, setCoupons] = useState<PosCoupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ orderNumber: number } | null>(null);

  const loadMenu = useCallback(async () => {
    const res = await fetch("/api/admin/menu", { cache: "no-store" });
    if (!res.ok) return;
    const body = await res.json();
    setCategories(body.categories ?? []);
    setProducts((body.products ?? []).filter((p: ProductWithToppings) => p.is_available));
  }, []);

  const loadCoupons = useCallback(async () => {
    const res = await fetch("/api/coupons?channel=pos", { cache: "no-store" });
    if (!res.ok) return;
    const body = await res.json();
    setCoupons(body.coupons ?? []);
  }, []);

  useEffect(() => {
    loadMenu();
    loadCoupons();
  }, [loadMenu, loadCoupons]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  function addToCart(product: ProductWithToppings, selectedToppings: Topping[], quantity: number) {
    const key = lineKey(product.id, selectedToppings.map((t) => t.id));
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...prev, { key, product, quantity, selectedToppings }];
    });
    setExpandedProductId(null);
  }

  function updateQuantity(key: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity } : l)));
  }

  const subtotal = useMemo(
    () =>
      cart.reduce((s, l) => {
        const toppingTotal = l.selectedToppings.reduce((ts, t) => ts + Number(t.price), 0);
        return s + (Number(l.product.price) + toppingTotal) * l.quantity;
      }, 0),
    [cart]
  );

  const selectedCoupon = coupons.find((c) => c.id === selectedCouponId) ?? null;
  const discountAmount = selectedCoupon ? (subtotal * Number(selectedCoupon.discount_percent)) / 100 : 0;
  const total = subtotal - discountAmount;

  async function confirmSale() {
    setError(null);
    if (cart.length === 0) return setError("Add at least one item.");
    if (!name.trim()) return setError("Customer name is required.");
    if (!/^[0-9]{10}$/.test(mobile.trim())) return setError("A valid 10-digit mobile number is required.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          source: "pos",
          markPaid: true,
          couponId: selectedCouponId,
          lines: cart.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
            toppingIds: l.selectedToppings.map((t) => t.id),
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not create sale.");
      setConfirmedOrder({ orderNumber: body.orderNumber });
      setCart([]);
      setName("");
      setMobile("");
      setSelectedCouponId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return (
      <div className="p-3 sm:p-6">
        <div className="card max-w-sm mx-auto text-center py-8">
          <div className="text-sm text-mocha">Order placed &amp; paid</div>
          <div className="text-2xl font-semibold text-chocolate mt-1">#{confirmedOrder.orderNumber}</div>
          <button onClick={() => setConfirmedOrder(null)} className="btn-primary mt-5 px-6">
            New sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="text-sm sm:text-base font-medium text-chocolate mb-3 sm:mb-5">POS sale</div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:flex-1 min-w-0">
          <div className="flex items-center gap-2 bg-vanilla rounded-lg px-3 py-2 mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items"
              className="bg-transparent flex-1 outline-none text-xs text-espresso placeholder:text-mocha"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filtered.map((product) => (
              <ItemPicker
                key={product.id}
                product={product}
                categoryName={categories.find((c) => c.id === product.category_id)?.name ?? ""}
                expanded={expandedProductId === product.id}
                onToggleExpand={() =>
                  setExpandedProductId((cur) => (cur === product.id ? null : product.id))
                }
                onAdd={(toppings, qty) => addToCart(product, toppings, qty)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-xs text-mocha text-center pt-6 sm:col-span-2">No items found.</div>
            )}
          </div>
        </div>

        <div className="lg:w-80 flex-shrink-0">
          <div className="card sticky top-3">
            <div className="text-xs font-medium text-chocolate mb-2">Current sale</div>
            {cart.length === 0 ? (
              <div className="text-[11px] text-mocha py-3 text-center">No items added yet.</div>
            ) : (
              <div className="flex flex-col gap-1.5 mb-2">
                {cart.map((line) => {
                  const toppingTotal = line.selectedToppings.reduce((s, t) => s + Number(t.price), 0);
                  const lineTotal = (Number(line.product.price) + toppingTotal) * line.quantity;
                  return (
                    <div key={line.key} className="flex justify-between items-center gap-2 text-xs text-espresso">
                      <div className="min-w-0">
                        <div className="truncate">{line.product.name}</div>
                        {line.selectedToppings.length > 0 && (
                          <div className="text-[10px] text-mocha truncate">
                            {line.selectedToppings.map((t) => t.name).join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(line.key, line.quantity - 1)}
                          className="w-5 h-5 rounded bg-vanilla text-mocha"
                        >
                          -
                        </button>
                        <span className="w-4 text-center">{line.quantity}</span>
                        <button
                          onClick={() => updateQuantity(line.key, line.quantity + 1)}
                          className="w-5 h-5 rounded bg-vanilla text-mocha"
                        >
                          +
                        </button>
                        <span className="w-12 text-right">Rs {lineTotal.toFixed(0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {coupons.length > 0 && (
              <div className="border-t border-gold/50 pt-2 mb-2">
                <div className="text-[11px] text-mocha mb-1">Coupon</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCouponId(null)}
                    className={`chip ${!selectedCouponId ? "bg-gold text-chocolate font-medium" : "bg-vanilla text-mocha"}`}
                  >
                    None
                  </button>
                  {coupons.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCouponId(c.id === selectedCouponId ? null : c.id)}
                      className={`chip ${
                        selectedCouponId === c.id ? "bg-gold text-chocolate font-medium" : "bg-vanilla text-mocha"
                      }`}
                    >
                      {c.name} &middot; {Number(c.discount_percent)}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gold/50 pt-2 flex flex-col gap-0.5">
              <div className="flex justify-between text-xs text-espresso">
                <span>Subtotal</span>
                <span>Rs {subtotal.toFixed(0)}</span>
              </div>
              {selectedCoupon && (
                <div className="flex justify-between text-xs text-strawberry">
                  <span>Discount</span>
                  <span>-Rs {discountAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium text-chocolate">
                <span>Total</span>
                <span>Rs {total.toFixed(0)}</span>
              </div>
            </div>

            <div className="border-t border-gold/50 mt-2 pt-2 flex flex-col gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer name"
                className="bg-cream rounded-lg px-3 py-2 text-xs outline-none"
              />
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Mobile number"
                inputMode="numeric"
                className="bg-cream rounded-lg px-3 py-2 text-xs outline-none"
              />
              {error && <div className="text-[11px] text-strawberry">{error}</div>}
              <button onClick={confirmSale} disabled={submitting} className="btn-primary text-xs py-2 disabled:opacity-60">
                {submitting ? "Processing..." : "Collect payment & confirm"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemPicker({
  product,
  categoryName,
  expanded,
  onToggleExpand,
  onAdd,
}: {
  product: ProductWithToppings;
  categoryName: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onAdd: (toppings: Topping[], quantity: number) => void;
}) {
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  function toggleTopping(id: string) {
    setSelectedToppingIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function handleClick() {
    if (product.toppings.length > 0) {
      onToggleExpand();
      return;
    }
    onAdd([], 1);
  }

  function confirmAdd() {
    const toppings = product.toppings.filter((t) => selectedToppingIds.includes(t.id));
    onAdd(toppings, quantity);
    setSelectedToppingIds([]);
    setQuantity(1);
  }

  return (
    <div className="card">
      <button onClick={handleClick} className="flex justify-between items-center w-full text-left">
        <div className="min-w-0">
          <div className="text-xs font-medium text-espresso truncate">{product.name}</div>
          <div className="text-[10px] text-mocha mt-0.5">
            {categoryName} &middot; Rs {Number(product.price).toFixed(0)}
          </div>
        </div>
        <span className="text-[11px] text-mocha flex-shrink-0 ml-2">
          {product.toppings.length > 0 ? (expanded ? "Close" : "Choose") : "Add"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-gold/50 flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {product.toppings.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTopping(t.id)}
                className={`chip ${
                  selectedToppingIds.includes(t.id) ? "bg-gold text-chocolate font-medium" : "bg-vanilla text-mocha"
                }`}
              >
                {t.name} {Number(t.price) > 0 ? `+Rs ${Number(t.price).toFixed(0)}` : ""}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-6 h-6 rounded bg-vanilla text-mocha">
              -
            </button>
            <span className="w-5 text-center text-xs">{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)} className="w-6 h-6 rounded bg-vanilla text-mocha">
              +
            </button>
            <button onClick={confirmAdd} className="btn-primary text-xs py-1.5 px-4 ml-auto">
              Add to sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
