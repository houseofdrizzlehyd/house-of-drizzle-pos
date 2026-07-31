import { computeTaxBreakup, sumTaxBreakups } from "@/lib/tax";
import { BUSINESS_INFO } from "@/lib/business-info";

export type ReceiptOrder = {
  order_number: number;
  customer_name: string;
  customer_mobile: string;
  subtotal: number;
  discount_amount: number;
  coupon_name?: string | null;
  created_at: string;
};

export type ReceiptItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  topping_names: string[];
  topping_price: number;
  line_total: number;
  gst_rate: number;
  is_free_reward: boolean;
};

export function Receipt({ order, items }: { order: ReceiptOrder; items: ReceiptItem[] }) {
  const taxBreakup = sumTaxBreakups(
    items.map((i) => computeTaxBreakup(Number(i.line_total), Number(i.gst_rate)))
  );
  const itemsTotal = order.subtotal + Number(order.discount_amount ?? 0);
  const createdAt = new Date(order.created_at);

  return (
    <div id="pos-receipt" className="bg-white text-black font-mono text-[11px] leading-snug px-2 py-3">
      <div className="flex flex-col items-center text-center gap-1 mb-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BUSINESS_INFO.logoUrl} alt={BUSINESS_INFO.name} className="h-10 w-auto" />
        <div className="text-[10px]">{BUSINESS_INFO.legalName}</div>
        {BUSINESS_INFO.addressLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
        <div>Ph: {BUSINESS_INFO.phone}</div>
        <div>GSTIN: {BUSINESS_INFO.gstin}</div>
      </div>

      <div className="border-t border-dashed border-black my-1.5" />

      <div className="flex justify-between">
        <span>Bill #{order.order_number}</span>
        <span>
          {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div>Customer: {order.customer_name}</div>
      <div>Mobile: {order.customer_mobile}</div>

      <div className="border-t border-dashed border-black my-1.5" />

      <div className="flex justify-between font-bold">
        <span>Item</span>
        <span>Amount</span>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="mt-1">
          <div className="flex justify-between">
            <span>
              {item.product_name}
              {item.quantity > 1 ? ` x${item.quantity}` : ""}
              {item.is_free_reward ? " (reward)" : ""}
            </span>
            <span>Rs {Number(item.line_total).toFixed(2)}</span>
          </div>
          {item.topping_names.length > 0 && (
            <div className="text-[10px] pl-2">+ {item.topping_names.join(", ")}</div>
          )}
        </div>
      ))}

      <div className="border-t border-dashed border-black my-1.5" />

      <div className="flex justify-between">
        <span>Items total</span>
        <span>Rs {itemsTotal.toFixed(2)}</span>
      </div>
      {Number(order.discount_amount) > 0 && (
        <div className="flex justify-between">
          <span>Discount{order.coupon_name ? ` (${order.coupon_name})` : ""}</span>
          <span>-Rs {Number(order.discount_amount).toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-[13px] mt-0.5">
        <span>Total</span>
        <span>Rs {Number(order.subtotal).toFixed(2)}</span>
      </div>

      <div className="border-t border-dashed border-black my-1.5" />

      <div>Tax breakup (incl. in total)</div>
      <div className="flex justify-between">
        <span>Taxable value</span>
        <span>Rs {taxBreakup.taxableValue.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>CGST</span>
        <span>Rs {taxBreakup.cgst.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>SGST</span>
        <span>Rs {taxBreakup.sgst.toFixed(2)}</span>
      </div>

      <div className="border-t border-dashed border-black my-1.5" />

      <div className="text-center">FSSAI No: {BUSINESS_INFO.fssai}</div>
      <div className="text-center mt-1">{BUSINESS_INFO.thankYouMessage}</div>
    </div>
  );
}
