import Link from "next/link";
import type { Product } from "@/lib/types";

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className={`card flex-shrink-0 block ${compact ? "w-32" : "w-full"}`}
    >
      <div className="w-full h-16 rounded-lg bg-belgian mb-2 overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : null}
      </div>
      <div className="text-xs font-medium text-espresso truncate">{product.name}</div>
      <div className="text-xs text-mocha mt-0.5">Rs {Number(product.price).toFixed(0)}</div>
      {!product.is_available && (
        <div className="chip bg-mocha text-vanilla mt-1 inline-block">Sold out</div>
      )}
    </Link>
  );
}
