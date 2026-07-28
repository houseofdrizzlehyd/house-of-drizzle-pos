"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, clearCart } = useCart();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function placeOrder() {
    setError(null);
    if (!name.trim()) return setError("Please enter your name.");
    if (!/^[0-9]{10}$/.test(mobile.trim())) return setError("Please enter a valid 10-digit mobile number.");
    if (lines.length === 0) return setError("Your cart is empty.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          lines: lines.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
            toppingIds: l.selectedToppings.map((t) => t.id),
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not place order. Please try again.");
      }
      const { orderId } = await res.json();
      clearCart();
      router.push(`/order/${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="pb-8">
        <div className="bg-chocolate px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-cream text-sm">&larr;</Link>
          <span className="text-cream text-sm font-medium">Checkout</span>
        </div>
        <div className="px-4 pt-10 text-center">
          <div className="text-sm text-mocha">Your cart is empty.</div>
          <Link href="/" className="btn-primary inline-block mt-4 px-6">Browse menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="bg-chocolate px-4 py-3 flex items-center gap-3">
        <Link href="/cart" className="text-cream text-sm">&larr;</Link>
        <span className="text-cream text-sm font-medium">Checkout</span>
      </div>

      <div className="px-4 pt-3.5">
        <div className="card flex flex-col gap-1.5">
          {lines.map((line) => {
            const toppingTotal = line.selectedToppings.reduce((s, t) => s + Number(t.price), 0);
            const lineTotal = (Number(line.product.price) + toppingTotal) * line.quantity;
            return (
              <div key={line.key} className="flex justify-between text-xs text-espresso">
                <span>
                  {line.product.name}
                  {line.quantity > 1 ? ` x${line.quantity}` : ""}
                </span>
                <span>Rs {lineTotal.toFixed(0)}</span>
              </div>
            );
          })}
          <div className="flex justify-between text-xs font-medium text-chocolate border-t border-gold/50 pt-1.5 mt-1">
            <span>Total</span>
            <span>Rs {subtotal.toFixed(0)}</span>
          </div>
        </div>
        <div className="text-[11px] text-mocha pt-1.5">All prices are inclusive of taxes.</div>
      </div>

      <div className="px-4 pt-4">
        <div className="text-[11px] text-mocha mb-1">Your name</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full bg-vanilla rounded-lg px-3 py-2.5 text-xs text-espresso outline-none placeholder:text-mocha"
        />
      </div>
      <div className="px-4 pt-2.5">
        <div className="text-[11px] text-mocha mb-1">Mobile number</div>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="Enter your mobile number"
          inputMode="numeric"
          className="w-full bg-vanilla rounded-lg px-3 py-2.5 text-xs text-espresso outline-none placeholder:text-mocha"
        />
      </div>

      {error && <div className="px-4 pt-3 text-xs text-strawberry">{error}</div>}

      <div className="px-4 pt-4">
        <button onClick={placeOrder} disabled={submitting} className="btn-primary w-full disabled:opacity-60">
          {submitting ? "Placing order..." : "Place order"}
        </button>
        <div className="text-center text-[10px] text-mocha mt-2">
          You&apos;ll get an order number &middot; pay at the counter
        </div>
      </div>
    </div>
  );
}
