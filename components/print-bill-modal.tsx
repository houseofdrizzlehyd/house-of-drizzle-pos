"use client";

import { Printer, X } from "lucide-react";
import type { PrintableBill } from "@/app/pos/actions";
import type { BillSettings } from "@/types/bill-settings";

export function PrintBillModal({
  bill,
  settings,
  onClose,
}: {
  bill: PrintableBill;
  settings: BillSettings;
  onClose: () => void;
}) {
  function printBill() {
    document.documentElement.style.setProperty(
      "--receipt-paper-width",
      `${settings.paper_width}mm`
    );
    window.print();
  }

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(bill.createdAt));

  return (
    <div className="print-modal fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="print-dialog w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="no-print flex items-center justify-between border-b border-[#eadfcf] p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b48a45]">
              Bill Saved
            </p>
            <h3 className="text-xl font-bold">Print bill now?</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#eadfcf] p-2"
            aria-label="Close print confirmation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="receipt-preview max-h-[60vh] overflow-y-auto p-5">
          <ThermalReceipt
            bill={bill}
            settings={settings}
            formattedDate={formattedDate}
          />
        </div>

        <div className="no-print grid grid-cols-2 gap-3 border-t border-[#eadfcf] p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[#d9c8b3] py-3 font-semibold"
          >
            Skip Print
          </button>
          <button
            type="button"
            onClick={printBill}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#3b2418] py-3 font-bold text-white"
          >
            <Printer size={18} />
            Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}

function ThermalReceipt({
  bill,
  settings,
  formattedDate,
}: {
  bill: PrintableBill;
  settings: BillSettings;
  formattedDate: string;
}) {
  const fontClass =
    settings.receipt_font_size === "small"
      ? "receipt-font-small"
      : settings.receipt_font_size === "large"
        ? "receipt-font-large"
        : "receipt-font-medium";

  return (
    <section
      id="thermal-receipt"
      className={`thermal-receipt ${fontClass} bg-white text-black`}
      style={{ width: `${settings.paper_width}mm` }}
    >
      <div style={{ textAlign: settings.header_alignment }}>
        {settings.show_logo && settings.logo_data_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logo_data_url}
            alt={settings.business_name}
            className="receipt-logo"
          />
        )}

        <h1>{settings.business_name}</h1>

        {settings.show_tagline && settings.tagline && (
          <p>{settings.tagline}</p>
        )}
        {settings.show_address && settings.address && (
          <p className="whitespace-pre-line">{settings.address}</p>
        )}
        {settings.show_phone && settings.phone && (
          <p>Phone: {settings.phone}</p>
        )}
        {settings.show_gst && settings.gst_number && (
          <p>GSTIN: {settings.gst_number}</p>
        )}
        <p>Customer Receipt</p>
      </div>

      <ReceiptDivider style={settings.divider_style} />

      <ReceiptRow left="Invoice No." right={bill.invoiceNumber} bold />
      <ReceiptRow left="Date" right={formattedDate} />

      {settings.show_customer_name && (
        <ReceiptRow left="Customer" right={bill.customerName} />
      )}
      {settings.show_customer_phone && (
        <ReceiptRow left="Mobile" right={bill.customerPhone} />
      )}
      {settings.show_payment_method && <ReceiptRow left="Payment" right={bill.paymentMethod.toUpperCase()} />}
      <ReceiptRow left="Place of Supply" right={bill.placeOfSupply} />

      <ReceiptDivider style={settings.divider_style} />

      <div className="receipt-item-header">
        <span>Item</span>
        <span>Amount</span>
      </div>

      {bill.items.map((item, index) => (
        <div key={`${item.name}-${index}`} className="receipt-item">
          <div className="receipt-item-name">{item.name}</div>
          <div className="receipt-item-detail">
            <span>
              {settings.show_item_rate
                ? `${item.quantity} × ₹${item.price.toFixed(2)}`
                : `Qty: ${item.quantity}`}
            </span>
            <strong>₹{item.lineTotal.toFixed(2)}</strong>
          </div>

          {item.toppings.map((topping, toppingIndex) => (
            <div
              key={`${topping.name}-${toppingIndex}`}
              className="receipt-topping"
            >
              <span>
                + {topping.name}
                {settings.show_item_rate
                  ? ` (${topping.quantity} × ₹${topping.price.toFixed(2)})`
                  : ` (Qty: ${topping.quantity})`}
              </span>
              <strong>₹{topping.lineTotal.toFixed(2)}</strong>
            </div>
          ))}
        </div>
      ))}

      <ReceiptDivider style={settings.divider_style} />

      <ReceiptRow left="Subtotal" right={`₹${bill.subtotal.toFixed(2)}`} />

      {settings.show_coupon && bill.discount > 0 && <ReceiptRow left={`Discount${bill.couponCode ? ` (${bill.couponCode})` : ""}`} right={`-₹${bill.discount.toFixed(2)}`} />}
      {bill.gstRate>0&&<><ReceiptRow left="Taxable Value" right={`₹${bill.taxableValue.toFixed(2)}`} /><ReceiptRow left={`CGST ${(bill.gstRate/2).toFixed(2)}%`} right={`₹${bill.cgst.toFixed(2)}`} /><ReceiptRow left={`SGST ${(bill.gstRate/2).toFixed(2)}%`} right={`₹${bill.sgst.toFixed(2)}`} /></>}
      <div className="receipt-total">
        <span>TOTAL</span>
        <strong>₹{bill.total.toFixed(2)}</strong>
      </div>

      {bill.gstRate>0&&bill.pricesIncludeTax&&<p className="receipt-tax-note">Prices are inclusive of {bill.gstRate}% GST</p>}
      <ReceiptDivider style={settings.divider_style} />
      <div className="receipt-center receipt-footer">
        <p>{settings.footer_message || "Thank you!"}</p>
      </div>
    </section>
  );
}

function ReceiptRow({
  left,
  right,
  bold = false,
}: {
  left: string;
  right: string;
  bold?: boolean;
}) {
  return (
    <div className={`receipt-row ${bold ? "font-bold" : ""}`}>
      <span>{left}</span>
      <span className="text-right">{right}</span>
    </div>
  );
}

function ReceiptDivider({
  style,
}: {
  style: BillSettings["divider_style"];
}) {
  if (style === "none") {
    return <div className="receipt-divider-space" />;
  }

  return (
    <div
      className="receipt-divider"
      style={{ borderTopStyle: style }}
    />
  );
}
