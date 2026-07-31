"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order, OrderItem } from "@/lib/types";

const STEPS = [
  { key: "placed", label: "Received" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
] as const;

function stepIndex(status: Order["status"]) {
  if (status === "placed") return 0;
  if (status === "preparing") return 1;
  return 2; // ready or completed
}

export function OrderStatusClient({
  orderId,
  initialOrder,
  initialItems,
}: {
  orderId: string;
  initialOrder: Order;
  initialItems: OrderItem[];
}) {
  const [order, setOrder] = useState(initialOrder);
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (!res.ok) return;
        const body = await res.json();
        setOrder(body.order);
        setItems(body.items ?? []);
      } catch {
        // silently retry on next interval
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [orderId]);

  const active = stepIndex(order.status);
  const rewardItem = items.find((i) => i.is_free_reward);

  return (
    <div className="pb-8">
      <div className="bg-chocolate px-4 py-3 text-center">
        <span className="topbar-title">Order confirmed</span>
      </div>

      <div className="px-4 pt-5 pb-1 text-center">
        <div className="text-[11px] text-mocha">Your order number</div>
        <div className="font-condensed text-4xl font-semibold text-chocolate mt-1">#{order.order_number}</div>
      </div>

      {rewardItem && (
        <div className="px-4 pt-1">
          <div className="bg-gold rounded-lg p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-chocolate flex items-center justify-center flex-shrink-0 text-cream text-sm">
              &#127873;
            </div>
            <div>
              <div className="text-xs font-medium text-chocolate">Reward unlocked!</div>
              <div className="text-[11px] text-chocolate mt-0.5">
                Enjoy a free {rewardItem.product_name}, on us.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-2 text-center">
        <div className="text-[11px] text-mocha">
          {order.is_paid
            ? "Thanks for paying at the counter."
            : "Show this number at the counter to pay and collect."}
        </div>
      </div>

      <div className="px-6 pt-5">
        <div className="flex items-center">
          {STEPS.map((step, idx) => (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    idx <= active ? "bg-gold text-chocolate" : "bg-vanilla text-mocha"
                  }`}
                >
                  {idx < active ? "✓" : idx + 1}
                </div>
                <span
                  className={`text-[10px] mt-1.5 text-center ${
                    idx <= active ? "text-chocolate font-medium" : "text-mocha"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 -mt-4 ${idx < active ? "bg-gold" : "bg-vanilla"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-6">
        <div className="section-title mb-2">Order summary</div>
        <div className="card flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-xs text-espresso">
              <span>
                {item.product_name}
                {item.quantity > 1 ? ` x${item.quantity}` : ""}
                {item.is_free_reward ? " (reward)" : ""}
              </span>
              <span className={item.is_free_reward ? "line-through text-mocha" : ""}>
                Rs {(item.unit_price * item.quantity + item.topping_price * item.quantity).toFixed(0)}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-xs font-medium text-chocolate border-t border-gold/50 pt-2 mt-1">
            <span>Total</span>
            <span className="font-condensed font-semibold text-chocolate text-sm">
              Rs {Number(order.subtotal).toFixed(0)}
            </span>
          </div>
        </div>
        <div className="text-[11px] text-mocha mt-2">
          For {order.customer_name} &middot; {order.customer_mobile}
        </div>
      </div>

      <div className="px-4 pt-5">
        <Link href="/" className="btn-primary block">Order more</Link>
      </div>
    </div>
  );
}
