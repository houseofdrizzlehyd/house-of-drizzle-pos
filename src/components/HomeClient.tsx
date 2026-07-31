"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/lib/cart-context";
import type { Category, Product } from "@/lib/types";

export function HomeClient({
  categories,
  specials,
  mustTry,
  allProducts,
}: {
  categories: Category[];
  specials: Product[];
  mustTry: Product[];
  allProducts: Product[];
}) {
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [query, allProducts]);

  return (
    <div className="pb-24">
      <div className="bg-chocolate px-4 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <a
            href="https://www.instagram.com/houseof_drizzle/"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <span className="text-cream text-[9px] font-medium">Follow Us on</span>
            <InstagramGlyph />
          </a>

          <div className="flex-1 min-w-0 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-mark.png" alt="House of Drizzle" className="h-[43px] w-auto" />
          </div>

          <div className="text-right flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-tagline.png" alt="Sip Scoop Drizzle Repeat" className="h-[50px] w-auto ml-auto" />
          </div>
        </div>
      </div>

      <div className="bg-mango overflow-hidden whitespace-nowrap">
        <div className="inline-flex animate-marquee">
          <MarqueeGroup />
          <MarqueeGroup />
        </div>
      </div>

      <div className="px-4 pt-3.5">
        <div className="flex items-center gap-2 bg-vanilla rounded-lg px-3 py-2.5">
          <span className="text-mocha text-sm">Search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search waffles, shakes, cheesecake..."
            className="bg-transparent flex-1 outline-none text-sm text-espresso placeholder:text-mocha"
          />
        </div>
      </div>

      {query.trim() ? (
        <div className="px-4 pt-4">
          <div className="section-title mb-2">
            {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {searchResults.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {specials.length > 0 && (
            <div className="pt-4 px-4">
              <div className="section-title mb-2.5">Today&apos;s special</div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {specials.map((p) => (
                  <ProductCard key={p.id} product={p} compact />
                ))}
              </div>
            </div>
          )}

          {mustTry.length > 0 && (
            <div className="pt-4 px-4">
              <div className="section-title mb-2.5">Must try</div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {mustTry.map((p) => (
                  <ProductCard key={p.id} product={p} compact />
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 px-4">
            <div className="section-title mb-2.5">Categories</div>
            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.id}`}
                  className="card flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-espresso">{c.name}</span>
                  <span className="text-mocha">&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <CartFab />
    </div>
  );
}

function MarqueeGroup() {
  return (
    <span className="flex items-center flex-shrink-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} className="text-xs font-medium text-chocolate px-4 py-1.5">
          Follow us on Instagram and get 5% off
        </span>
      ))}
    </span>
  );
}

function InstagramGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="#F7F2E8" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="#F7F2E8" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="#F7F2E8" />
    </svg>
  );
}

function CartFab() {
  const { itemCount, subtotal } = useCart();
  if (itemCount === 0) return null;
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-chocolate px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.18)]">
      <Link href="/cart" className="flex items-center gap-2.5 min-w-0">
        <span className="relative flex-shrink-0">
          <CartGlyph />
          <span className="absolute -top-1.5 -right-1.5 bg-gold text-chocolate text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
            {itemCount}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-cream text-xs font-medium">Cart</span>
          <span className="block text-gold text-[11px]">Rs {subtotal.toFixed(0)}</span>
        </span>
      </Link>
      <Link href="/checkout" className="btn-primary px-4 py-2 text-xs flex-shrink-0">
        Proceed to checkout
      </Link>
    </div>
  );
}

function CartGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6"
        stroke="#F7F2E8"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="21" r="1.3" fill="#F7F2E8" />
      <circle cx="17" cy="21" r="1.3" fill="#F7F2E8" />
    </svg>
  );
}
