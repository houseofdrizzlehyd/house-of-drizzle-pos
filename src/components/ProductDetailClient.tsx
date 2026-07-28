"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import type { Product, Topping } from "@/lib/types";

export function ProductDetailClient({ product, toppings }: { product: Product; toppings: Topping[] }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantity, setQuantity] = useState(1);

  const selectedToppings = useMemo(
    () => toppings.filter((t) => selected[t.id]),
    [toppings, selected]
  );

  const unitTotal = Number(product.price) + selectedToppings.reduce((s, t) => s + Number(t.price), 0);
  const lineTotal = unitTotal * quantity;

  function toggleTopping(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleAddToCart() {
    addToCart(product, selectedToppings, quantity);
    router.push("/cart");
  }

  return (
    <div className="pb-8">
      <div className="bg-chocolate px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-cream text-sm">&larr;</Link>
        <span className="text-cream text-sm font-medium">Item details</span>
      </div>

      <div className="w-full h-36 bg-belgian">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : null}
      </div>

      <div className="px-4 pt-3.5">
        <div className="text-base font-medium text-espresso">{product.name}</div>
        {product.description && (
          <div className="text-xs text-mocha mt-1 leading-relaxed">{product.description}</div>
        )}
        <div className="text-base font-medium text-chocolate mt-2">Rs {Number(product.price).toFixed(0)}</div>
      </div>

      {toppings.length > 0 && (
        <div className="px-4 pt-4">
          <div className="text-sm font-medium text-chocolate mb-2">Add toppings</div>
          <div className="flex flex-col gap-2">
            {toppings.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTopping(t.id)}
                className="flex items-center justify-between bg-vanilla rounded-lg px-3 py-2.5 text-left"
              >
                <span className="text-xs text-espresso">{t.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] text-mocha">+Rs {Number(t.price).toFixed(0)}</span>
                  <span
                    className={`w-4 h-4 rounded border-[1.5px] border-gold ${
                      selected[t.id] ? "bg-gold" : ""
                    }`}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-4 flex items-center gap-3">
        <div className="flex items-center gap-3 bg-vanilla rounded-lg px-2.5 py-1.5">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="text-chocolate px-1"
            aria-label="Decrease quantity"
          >
            &minus;
          </button>
          <span className="text-sm text-espresso min-w-[1.2rem] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="text-chocolate px-1"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button onClick={handleAddToCart} className="btn-primary flex-1">
          Add to cart &middot; Rs {lineTotal.toFixed(0)}
        </button>
      </div>
    </div>
  );
}
