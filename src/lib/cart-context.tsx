"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine, Product, Topping } from "@/lib/types";

const STORAGE_KEY = "hod_cart_v1";

type CartContextValue = {
  lines: CartLine[];
  addToCart: (product: Product, selectedToppings: Topping[], quantity: number) => void;
  removeLine: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(productId: string, toppingIds: string[]) {
  return `${productId}::${[...toppingIds].sort().join(",")}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupted cart state
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addToCart: CartContextValue["addToCart"] = (product, selectedToppings, quantity) => {
    const key = lineKey(product.id, selectedToppings.map((t) => t.id));
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { key, product, quantity, selectedToppings }];
    });
  };

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) return removeLine(key);
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity } : l)));
  };

  const clearCart = () => setLines([]);

  const { itemCount, subtotal } = useMemo(() => {
    let itemCount = 0;
    let subtotal = 0;
    for (const line of lines) {
      const toppingTotal = line.selectedToppings.reduce((s, t) => s + Number(t.price), 0);
      itemCount += line.quantity;
      subtotal += (Number(line.product.price) + toppingTotal) * line.quantity;
    }
    return { itemCount, subtotal };
  }, [lines]);

  return (
    <CartContext.Provider
      value={{ lines, addToCart, removeLine, updateQuantity, clearCart, itemCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
