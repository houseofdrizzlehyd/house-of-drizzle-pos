"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CartPage() {
  const { lines, removeLine, subtotal } = useCart();

  return (
    <div className="pb-8">
      <div className="bg-chocolate px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-cream text-sm">&larr;</Link>
        <span className="text-cream text-sm font-medium">Your cart</span>
      </div>

      <div className="px-4 pt-3.5 flex flex-col gap-2.5">
        {lines.length === 0 && (
          <div className="text-sm text-mocha text-center pt-8">Your cart is empty.</div>
        )}
        {lines.map((line) => {
          const toppingTotal = line.selectedToppings.reduce((s, t) => s + Number(t.price), 0);
          const lineTotal = (Number(line.product.price) + toppingTotal) * line.quantity;
          return (
            <div key={line.key} className="card flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-espresso">{line.product.name}</div>
                <div className="text-[11px] text-mocha mt-0.5">
                  {line.selectedToppings.length > 0
                    ? `${line.selectedToppings.map((t) => t.name).join(", ")} · Qty ${line.quantity}`
                    : `Qty ${line.quantity}`}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-espresso">Rs {lineTotal.toFixed(0)}</span>
                <button onClick={() => removeLine(line.key)} className="text-mocha text-xs" aria-label="Remove">
                  &#10005;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {lines.length > 0 && (
        <>
          <div className="px-4 pt-3.5 flex justify-between border-t border-gold/40 mt-3.5 pt-3">
            <span className="text-sm font-medium text-chocolate">Total</span>
            <span className="text-sm font-medium text-chocolate">Rs {subtotal.toFixed(0)}</span>
          </div>
          <div className="text-[11px] text-mocha px-4 pt-1">All prices are inclusive of taxes.</div>

          <div className="px-4 pt-5 flex gap-3">
            <Link href="/" className="chip bg-vanilla text-mocha border border-gold flex-1 text-center py-2.5">
              Add more
            </Link>
            <Link href="/checkout" className="btn-primary flex-1 text-center">
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
