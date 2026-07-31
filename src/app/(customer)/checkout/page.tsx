"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Spinner } from "@/components/Spinner";
import { DessertPlaceholder } from "@/components/DessertPlaceholder";

type WebCoupon = { id: string; name: string; discount_percent: number };
type OrderType = "dine_in" | "delivery";
type DeliverySettings = { minimumOrderAmount: number; deliveryCharge: number };

const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = { minimumOrderAmount: 200, deliveryCharge: 0 };

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, clearCart } = useCart();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<WebCoupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(DEFAULT_DELIVERY_SETTINGS);

  useEffect(() => {
    fetch("/api/coupons?channel=web")
      .then((res) => res.json())
      .then((body) => setCoupons(body.coupons ?? []))
      .catch(() => {});
    fetch("/api/delivery-settings")
      .then((res) => res.json())
      .then((body) =>
        setDeliverySettings({
          minimumOrderAmount: Number(body.minimumOrderAmount) || 200,
          deliveryCharge: Number(body.deliveryCharge) || 0,
        })
      )
      .catch(() => {});
  }, []);

  const selectedCoupon = coupons.find((c) => c.id === selectedCouponId) ?? null;
  const discountAmount = selectedCoupon ? (subtotal * Number(selectedCoupon.discount_percent)) / 100 : 0;
  const foodTotal = subtotal - discountAmount;
  const deliveryChargeValue = orderType === "delivery" ? deliverySettings.deliveryCharge : 0;
  const total = foodTotal + deliveryChargeValue;

  async function placeOrder() {
    setError(null);
    if (!name.trim()) return setError("Please enter your name.");
    if (!/^[0-9]{10}$/.test(mobile.trim())) return setError("Please enter a valid 10-digit mobile number.");
    if (lines.length === 0) return setError("Your cart is empty.");
    if (orderType === "delivery") {
      if (!deliveryAddress.trim()) return setError("Please enter your delivery address.");
      if (foodTotal < deliverySettings.minimumOrderAmount) {
        return setError(`Delivery orders need a minimum of Rs ${deliverySettings.minimumOrderAmount}.`);
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          couponId: selectedCouponId,
          orderType,
          deliveryAddress: orderType === "delivery" ? deliveryAddress.trim() : undefined,
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
      // Keep the spinner running through the redirect instead of flashing
      // back to idle before the order status page has loaded.
      router.push(`/order/${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="pb-8">
        <div className="bg-chocolate px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-cream text-sm">&larr;</Link>
          <span className="topbar-title">Checkout</span>
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
        <span className="topbar-title">Checkout</span>
      </div>

      <div className="px-4 pt-3.5">
        <div className="card flex flex-col gap-1.5">
          {lines.map((line) => {
            const toppingTotal = line.selectedToppings.reduce((s, t) => s + Number(t.price), 0);
            const lineTotal = (Number(line.product.price) + toppingTotal) * line.quantity;
            return (
              <div key={line.key} className="flex items-center justify-between gap-2.5 text-xs text-espresso">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-md bg-belgian overflow-hidden flex items-center justify-center flex-shrink-0">
                    {line.product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.product.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <DessertPlaceholder className="w-3.5 h-3.5 text-mocha" />
                    )}
                  </span>
                  <span className="truncate">
                    {line.product.name}
                    {line.quantity > 1 ? ` x${line.quantity}` : ""}
                  </span>
                </span>
                <span className="flex-shrink-0">Rs {lineTotal.toFixed(0)}</span>
              </div>
            );
          })}
          {selectedCoupon && (
            <div className="flex justify-between text-xs text-strawberry">
              <span>{selectedCoupon.name} ({Number(selectedCoupon.discount_percent)}% off)</span>
              <span>-Rs {discountAmount.toFixed(0)}</span>
            </div>
          )}
          {deliveryChargeValue > 0 && (
            <div className="flex justify-between text-xs text-espresso">
              <span>Delivery charge</span>
              <span>Rs {deliveryChargeValue.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-medium text-chocolate border-t border-gold/50 pt-1.5 mt-1">
            <span>Total</span>
            <span className="font-condensed font-semibold text-chocolate text-sm">Rs {total.toFixed(0)}</span>
          </div>
        </div>
        <div className="text-[11px] text-mocha pt-1.5">All prices are inclusive of taxes.</div>
      </div>

      <div className="px-4 pt-4">
        <div className="text-[11px] text-mocha mb-1">How would you like to get your order?</div>
        <div className="flex gap-2">
          <button
            onClick={() => setOrderType("dine_in")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-medium border ${
              orderType === "dine_in" ? "bg-gold text-chocolate border-gold" : "bg-vanilla text-mocha border-transparent"
            }`}
          >
            Pickup at counter
          </button>
          <button
            onClick={() => setOrderType("delivery")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-medium border ${
              orderType === "delivery" ? "bg-gold text-chocolate border-gold" : "bg-vanilla text-mocha border-transparent"
            }`}
          >
            Home delivery
          </button>
        </div>

        {orderType === "delivery" && (
          <div className="mt-3">
            <div className="text-[11px] text-mocha mb-1">
              Delivery address (within ~3km of the store · min. order Rs {deliverySettings.minimumOrderAmount}
              {deliverySettings.deliveryCharge > 0 ? ` · Rs ${deliverySettings.deliveryCharge} delivery charge` : ""})
            </div>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="House/flat no., street, landmark, area"
              rows={3}
              className="w-full bg-vanilla rounded-lg px-3 py-2.5 text-xs text-espresso outline-none placeholder:text-mocha resize-none"
            />
            {foodTotal < deliverySettings.minimumOrderAmount && (
              <div className="text-[11px] text-strawberry mt-1">
                Add Rs {(deliverySettings.minimumOrderAmount - foodTotal).toFixed(0)} more to qualify for delivery.
              </div>
            )}
          </div>
        )}
      </div>

      {coupons.length > 0 && (
        <div className="px-4 pt-3.5">
          <div className="text-[11px] text-mocha mb-1">Available coupons</div>
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
                {c.name} &middot; {Number(c.discount_percent)}% off
              </button>
            ))}
          </div>
        </div>
      )}

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
        <button
          onClick={placeOrder}
          disabled={submitting}
          className="btn-primary w-full disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? "Placing order..." : "Place order"}
        </button>
        <div className="text-center text-[10px] text-mocha mt-2">
          {orderType === "delivery"
            ? "Our team will call you shortly to confirm your order and share a payment QR."
            : "You'll get an order number · pay at the counter"}
        </div>
      </div>
    </div>
  );
}
