"use client";

import { useCallback, useEffect, useState } from "react";
import type { Order, OrderItem, OrderSource, OrderType } from "@/lib/types";
import { Spinner } from "@/components/Spinner";
import { Receipt, type ReceiptItem, type ReceiptOrder } from "@/components/Receipt";

type OrderWithItems = Order & { items: OrderItem[] };
type ReceiptData = { order: ReceiptOrder; items: ReceiptItem[] };

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 1) return "just now";
  return `${mins} min ago`;
}

function SourceBadge({ source }: { source: OrderSource }) {
  return (
    <span className={`chip ml-1.5 ${source === "pos" ? "bg-mocha text-cream" : "bg-vanilla text-mocha"}`}>
      {source === "pos" ? "POS" : "Web"}
    </span>
  );
}

function OrderTypeBadge({ orderType }: { orderType: OrderType }) {
  if (orderType !== "delivery") return null;
  return <span className="chip ml-1.5 bg-mango text-chocolate font-medium">Delivery</span>;
}

function OrderDetailsModal({ order, onClose }: { order: OrderWithItems; onClose: () => void }) {
  const total = Number(order.subtotal) + Number(order.delivery_charge);
  const createdAt = new Date(order.created_at);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-cream w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center flex-wrap">
              <span className="text-sm font-medium text-chocolate">Order #{order.order_number}</span>
              <SourceBadge source={order.source} />
              <OrderTypeBadge orderType={order.order_type} />
            </div>
            <div className="text-[11px] text-mocha mt-1">
              {createdAt.toLocaleDateString()}{" "}
              {createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <button onClick={onClose} className="text-mocha text-lg leading-none px-1">
            &times;
          </button>
        </div>

        <div className="bg-vanilla rounded-lg p-3 mb-3">
          <div className="text-[10px] uppercase tracking-wide text-mocha mb-1">Customer</div>
          <div className="text-xs text-chocolate font-medium">{order.customer_name}</div>
          <a href={`tel:${order.customer_mobile}`} className="text-xs text-mocha underline">
            {order.customer_mobile}
          </a>
          {order.order_type === "delivery" && order.delivery_address && (
            <div className="text-[11px] text-mocha mt-2">
              <span className="font-medium text-chocolate">Deliver to:</span> {order.delivery_address}
              {order.delivery_lat != null && order.delivery_lng != null && (
                <>
                  {" "}
                  &middot;{" "}
                  <a
                    href={`https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mango underline"
                  >
                    View on map
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        <div className="text-[10px] uppercase tracking-wide text-mocha mb-1.5">Items</div>
        <div className="flex flex-col gap-2 mb-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-xs">
              <div className="min-w-0">
                {item.category_name && (
                  <div className="text-[9.5px] uppercase tracking-wide text-mocha">{item.category_name}</div>
                )}
                <div className="text-espresso">
                  {item.product_name}
                  {item.quantity > 1 ? ` x${item.quantity}` : ""}
                  {item.is_free_reward ? " (reward)" : ""}
                </div>
                {item.topping_names.length > 0 && (
                  <div className="text-[10px] text-mocha">+ {item.topping_names.join(", ")}</div>
                )}
              </div>
              <span className="text-chocolate flex-shrink-0 ml-2">Rs {Number(item.line_total).toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gold/50 pt-2 flex flex-col gap-1 text-xs">
          <div className="flex justify-between text-espresso">
            <span>Items total</span>
            <span>Rs {(Number(order.subtotal) + Number(order.discount_amount)).toFixed(0)}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-strawberry">
              <span>Discount</span>
              <span>-Rs {Number(order.discount_amount).toFixed(0)}</span>
            </div>
          )}
          {Number(order.delivery_charge) > 0 && (
            <div className="flex justify-between text-espresso">
              <span>Delivery charge</span>
              <span>Rs {Number(order.delivery_charge).toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-chocolate text-sm pt-1">
            <span>Total</span>
            <span>Rs {total.toFixed(0)}</span>
          </div>
        </div>

        <div className="mt-3">
          <span className={`chip ${order.is_paid ? "bg-pistachio text-[#EAF3DE]" : "bg-strawberry text-[#FBEAF0]"}`}>
            {order.is_paid ? "Paid" : "Unpaid"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    if (!res.ok) return;
    const body = await res.json();
    setOrders(body.orders ?? []);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  // Once the fetched receipt is in the DOM, open the print dialog.
  useEffect(() => {
    if (receiptData) window.print();
  }, [receiptData]);

  async function act(id: string, action: "mark_paid" | "mark_ready" | "mark_completed") {
    setBusyId(id);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
    setBusyId(null);
  }

  async function printBill(id: string) {
    setPrintingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();
      setReceiptData({ order: body.order, items: body.items });
    } finally {
      setPrintingId(null);
    }
  }

  async function deleteOrder(id: string, orderNumber: number) {
    if (!window.confirm(`Delete order #${orderNumber}? This can't be undone.`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  const unpaid = orders.filter((o) => o.status === "placed");
  const inKitchen = orders.filter((o) => o.status === "preparing" || o.status === "ready");

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <span className="text-sm sm:text-base font-medium text-chocolate">Orders</span>
        <span className="flex items-center gap-1.5 text-[11px] text-mocha">
          <span className="w-1.5 h-1.5 rounded-full bg-pistachio" /> Live
        </span>
      </div>

      <div className="flex gap-1.5 mb-4">
        <span className="chip bg-gold text-chocolate">Unpaid &middot; {unpaid.length}</span>
        <span className="chip bg-vanilla text-mocha">In kitchen &middot; {inKitchen.length}</span>
      </div>

      {loading ? (
        <div className="flex justify-center pt-10">
          <Spinner className="h-6 w-6 text-mocha" />
        </div>
      ) : (
      <div className="sm:grid sm:grid-cols-2 sm:gap-6">
      <div>
      <div className="text-[10px] uppercase tracking-wide text-mocha mb-2">Awaiting payment</div>
      <div className="flex flex-col gap-2.5 mb-5 sm:mb-0">
        {unpaid.length === 0 && <div className="text-xs text-mocha">No unpaid orders.</div>}
        {unpaid.map((order) => (
          <div key={order.id} className="bg-strawberry/10 border-l-[3px] border-strawberry rounded-r-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm font-medium text-chocolate">#{order.order_number}</span>
                <span className="text-[11px] text-mocha ml-1.5">{order.customer_name}</span>
                <SourceBadge source={order.source} />
                <OrderTypeBadge orderType={order.order_type} />
              </div>
              <span className="chip bg-strawberry text-[#FBEAF0]">Unpaid</span>
            </div>
            <div className="text-[11px] text-espresso mt-1.5 leading-relaxed">
              {order.items.map((i) => (
                <div key={i.id}>
                  {i.product_name}
                  {i.quantity > 1 ? ` x${i.quantity}` : ""}
                  {i.is_free_reward ? " (reward)" : ""}
                </div>
              ))}
            </div>
            {order.order_type === "delivery" && order.delivery_address && (
              <div className="text-[11px] text-mocha mt-1.5">
                <span className="font-medium text-chocolate">Deliver to:</span> {order.delivery_address}
                {order.delivery_lat != null && order.delivery_lng != null && (
                  <>
                    {" "}
                    &middot;{" "}
                    <a
                      href={`https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mango underline"
                    >
                      View on map
                    </a>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-xs font-medium text-chocolate">
                Rs {(Number(order.subtotal) + Number(order.delivery_charge)).toFixed(0)}
                {Number(order.discount_amount) > 0 && (
                  <span className="text-[10px] text-strawberry ml-1">
                    (-Rs {Number(order.discount_amount).toFixed(0)})
                  </span>
                )}
                {Number(order.delivery_charge) > 0 && (
                  <span className="text-[10px] text-mocha ml-1">
                    (+Rs {Number(order.delivery_charge).toFixed(0)} delivery)
                  </span>
                )}
              </span>
              <button
                onClick={() => act(order.id, "mark_paid")}
                disabled={busyId === order.id}
                className="chip bg-gold text-chocolate font-medium disabled:opacity-60 flex items-center gap-1.5"
              >
                {busyId === order.id && <Spinner className="h-3 w-3" />}
                {order.order_type === "delivery" ? "Confirmed & paid" : "Mark as paid"}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-mocha">{timeAgo(order.created_at)}</span>
              <span className="flex items-center gap-3">
                <button
                  onClick={() => setViewOrderId(order.id)}
                  className="text-[10px] text-mocha underline"
                >
                  View
                </button>
                <button
                  onClick={() => deleteOrder(order.id, order.order_number)}
                  disabled={deletingId === order.id}
                  className="text-[10px] text-strawberry underline inline-flex items-center gap-1 disabled:opacity-60"
                >
                  {deletingId === order.id && <Spinner className="h-2.5 w-2.5" />}
                  Delete
                </button>
              </span>
            </div>
          </div>
        ))}
      </div>
      </div>

      <div>
      <div className="text-[10px] uppercase tracking-wide text-mocha mb-2">In the kitchen</div>
      <div className="flex flex-col gap-2.5">
        {inKitchen.length === 0 && <div className="text-xs text-mocha">Nothing in progress.</div>}
        {inKitchen.map((order) => (
          <div
            key={order.id}
            className={`rounded-lg p-3 ${
              order.status === "preparing"
                ? "bg-mango/10 border-l-[3px] border-mango rounded-r-lg"
                : "bg-vanilla"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm font-medium text-chocolate">#{order.order_number}</span>
                <span className="text-[11px] text-mocha ml-1.5">{order.customer_name}</span>
                <SourceBadge source={order.source} />
                <OrderTypeBadge orderType={order.order_type} />
              </div>
              <span className="chip bg-pistachio text-[#EAF3DE]">Paid</span>
            </div>
            <div className="text-[11px] text-espresso mt-1.5 leading-relaxed">
              {order.items.map((i) => (
                <div key={i.id}>
                  {i.product_name}
                  {i.quantity > 1 ? ` x${i.quantity}` : ""}
                  {i.is_free_reward ? " (reward)" : ""}
                </div>
              ))}
            </div>
            {order.order_type === "delivery" && order.delivery_address && (
              <div className="text-[11px] text-mocha mt-1.5">
                <span className="font-medium text-chocolate">Deliver to:</span> {order.delivery_address}
                {order.delivery_lat != null && order.delivery_lng != null && (
                  <>
                    {" "}
                    &middot;{" "}
                    <a
                      href={`https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mango underline"
                    >
                      View on map
                    </a>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-xs font-medium text-chocolate">
                Rs {(Number(order.subtotal) + Number(order.delivery_charge)).toFixed(0)}
                {Number(order.discount_amount) > 0 && (
                  <span className="text-[10px] text-strawberry ml-1">
                    (-Rs {Number(order.discount_amount).toFixed(0)})
                  </span>
                )}
                {Number(order.delivery_charge) > 0 && (
                  <span className="text-[10px] text-mocha ml-1">
                    (+Rs {Number(order.delivery_charge).toFixed(0)} delivery)
                  </span>
                )}
              </span>
              {order.status === "preparing" ? (
                <button
                  onClick={() => act(order.id, "mark_ready")}
                  disabled={busyId === order.id}
                  className="chip bg-pistachio text-[#EAF3DE] font-medium disabled:opacity-60 flex items-center gap-1.5"
                >
                  {busyId === order.id && <Spinner className="h-3 w-3" />}
                  {order.order_type === "delivery" ? "Out for delivery" : "Mark ready"}
                </button>
              ) : (
                <button
                  onClick={() => act(order.id, "mark_completed")}
                  disabled={busyId === order.id}
                  className="chip bg-gold text-chocolate font-medium disabled:opacity-60 flex items-center gap-1.5"
                >
                  {busyId === order.id && <Spinner className="h-3 w-3" />}
                  {order.order_type === "delivery" ? "Mark delivered" : "Complete"}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <button
                onClick={() => deleteOrder(order.id, order.order_number)}
                disabled={deletingId === order.id}
                className="text-[10px] text-strawberry underline inline-flex items-center gap-1 disabled:opacity-60"
              >
                {deletingId === order.id && <Spinner className="h-2.5 w-2.5" />}
                Delete
              </button>
              <span className="flex items-center gap-3">
                <button
                  onClick={() => setViewOrderId(order.id)}
                  className="text-[10px] text-mocha underline"
                >
                  View
                </button>
                <button
                  onClick={() => printBill(order.id)}
                  disabled={printingId === order.id}
                  className="text-[10px] text-mocha underline inline-flex items-center gap-1 disabled:opacity-60"
                >
                  {printingId === order.id && <Spinner className="h-2.5 w-2.5" />}
                  Print bill
                </button>
              </span>
            </div>
          </div>
        ))}
      </div>
      </div>
      </div>
      )}

      {receiptData && <Receipt order={receiptData.order} items={receiptData.items} />}

      {viewOrderId && (() => {
        const order = orders.find((o) => o.id === viewOrderId);
        return order ? <OrderDetailsModal order={order} onClose={() => setViewOrderId(null)} /> : null;
      })()}
    </div>
  );
}
