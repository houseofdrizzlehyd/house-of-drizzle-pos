"use server";

import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type BillTopping = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type BillItem = {
  id: string;
  cartId: string;
  name: string;
  price: number;
  quantity: number;
  toppings: BillTopping[];
};

export type PrintedBillTopping = {
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

export type PrintedBillItem = {
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  toppings: PrintedBillTopping[];
};

export type PrintableBill = {
  billNumber: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  couponCode: string | null;
  subtotal: number;
  discount: number;
  total: number; taxableValue: number; cgst: number; sgst: number; igst: number; totalTax: number; gstRate: number; pricesIncludeTax: boolean; invoiceNumber: string; placeOfSupply: string;
  createdAt: string;
  items: PrintedBillItem[];
};

export type BillState = {
  status: "idle" | "success" | "error";
  message: string;
  printableBill?: PrintableBill;
};

export async function completeBill(
  _previousState: BillState,
  formData: FormData
): Promise<BillState> {
  const profile = await requireProfile();
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerPhone = String(formData.get("customer_phone") ?? "").replace(/\D/g, "");
  const paymentMethod = String(formData.get("payment_method") ?? "");
  const couponId = String(formData.get("coupon_id") ?? "") || null;

  let items: BillItem[] = [];

  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { status: "error", message: "The bill items are invalid." };
  }

  if (!customerName) {
    return { status: "error", message: "Customer name is required." };
  }

  if (customerPhone.length !== 10) {
    return { status: "error", message: "Enter a valid 10-digit customer number." };
  }

  if (!["cash", "upi", "card"].includes(paymentMethod)) {
    return { status: "error", message: "Select a payment method." };
  }

  if (!items.length || items.some((item) => item.quantity <= 0 || item.price < 0)) {
    return { status: "error", message: "Add at least one valid product." };
  }

  const supabase = await createClient(); const admin = createAdminClient();
  const {data:taxSettings,error:taxError}=await supabase.from("tax_settings").select("*").eq("id",1).single();
  if(taxError||!taxSettings) return {status:"error",message:"Tax settings are unavailable."};

  const subtotal = items.reduce((sum, item) => {
    const base = Number(item.price) * Number(item.quantity);
    const toppings = (item.toppings ?? []).reduce(
      (toppingSum, topping) =>
        toppingSum + Number(topping.price) * Number(topping.quantity),
      0
    );
    return sum + base + toppings;
  }, 0);

  let discount = 0;
  let appliedCouponId: string | null = null;
  let couponCode: string | null = null;

  if (couponId) {
    const now = new Date().toISOString();

    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", couponId)
      .eq("is_active", true)
      .single();

    if (couponError || !coupon) {
      return { status: "error", message: "The selected coupon is unavailable." };
    }

    if (
      (coupon.starts_at && coupon.starts_at > now) ||
      (coupon.ends_at && coupon.ends_at < now)
    ) {
      return {
        status: "error",
        message: "The selected coupon is not currently valid.",
      };
    }

    if (subtotal < Number(coupon.minimum_order)) {
      return {
        status: "error",
        message: `Minimum bill for ${coupon.code} is ₹${Number(
          coupon.minimum_order
        )}.`,
      };
    }

    discount =
      coupon.discount_type === "percentage"
        ? subtotal * (Number(coupon.discount_value) / 100)
        : Number(coupon.discount_value);

    if (coupon.maximum_discount) {
      discount = Math.min(discount, Number(coupon.maximum_discount));
    }

    discount = Math.min(discount, subtotal);
    appliedCouponId = coupon.id;
    couponCode = coupon.code;
  }

  discount=Math.round(discount*100)/100; const discounted=Math.max(0,subtotal-discount); const gstRate=taxSettings.gst_enabled?Number(taxSettings.gst_rate):0;
  let taxableValue=discounted,totalTax=0,total=discounted;
  if(taxSettings.gst_enabled){ if(taxSettings.prices_include_tax){taxableValue=discounted/(1+gstRate/100); totalTax=discounted-taxableValue;} else {totalTax=taxableValue*gstRate/100; total=taxableValue+totalTax;} }
  taxableValue=Math.round(taxableValue*100)/100; totalTax=Math.round(totalTax*100)/100; total=Math.round(total*100)/100; const cgst=Math.round(totalTax/2*100)/100; const sgst=Math.round((totalTax-cgst)*100)/100; const igst=0;

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", customerPhone)
    .maybeSingle();

  let customerId = existingCustomer?.id;

  if (customerId) {
    const { error } = await supabase
      .from("customers")
      .update({ name: customerName })
      .eq("id", customerId);

    if (error) {
      return { status: "error", message: error.message };
    }
  } else {
    const { data, error } = await supabase
      .from("customers")
      .insert({ name: customerName, phone: customerPhone })
      .select("id")
      .single();

    if (error || !data) {
      return {
        status: "error",
        message: error?.message ?? "Customer could not be saved.",
      };
    }

    customerId = data.id;
  }

  const createdAt = new Date().toISOString();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      subtotal, discount, tax: totalTax, taxable_value: taxableValue, cgst, sgst, igst, gst_rate: gstRate, prices_include_tax: Boolean(taxSettings.prices_include_tax), total,
      payment_method: paymentMethod,
      created_by: profile.id,
      coupon_id: appliedCouponId,
      coupon_code: couponCode,
      created_at: createdAt,
    })
    .select("id, bill_number")
    .single();

  if(orderError||!order) return {status:"error",message:orderError?.message??"Bill could not be saved."};
  const invoiceNumber=`${taxSettings.invoice_prefix}-${String(order.bill_number).padStart(6,"0")}`;
  const {error:invError}=await admin.from("orders").update({invoice_number:invoiceNumber}).eq("id",order.id); if(invError) return {status:"error",message:invError.message};

  for (const item of items) {
    const { data: parentItem, error: parentError } = await admin
      .from("order_items")
      .insert({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        line_total: item.price * item.quantity,
        parent_order_item_id: null,
      })
      .select("id")
      .single();

    if (parentError || !parentItem) {
      return {
        status: "error",
        message: parentError?.message ?? "Main product could not be saved.",
      };
    }

    if (item.toppings?.length) {
      const { error: toppingError } = await admin.from("order_items").insert(
        item.toppings.map((topping) => ({
          order_id: order.id,
          product_id: topping.id,
          product_name: topping.name,
          unit_price: topping.price,
          quantity: topping.quantity,
          line_total: topping.price * topping.quantity,
          parent_order_item_id: parentItem.id,
        }))
      );

      if (toppingError) {
        return { status: "error", message: toppingError.message };
      }
    }
  }

  return {
    status: "success",
    message: `${invoiceNumber} completed successfully.`, printableBill: {
      billNumber: order.bill_number, invoiceNumber,
      customerName,
      customerPhone,
      paymentMethod,
      couponCode,
      subtotal, discount, total, taxableValue, cgst, sgst, igst, totalTax, gstRate, pricesIncludeTax:Boolean(taxSettings.prices_include_tax), placeOfSupply:taxSettings.place_of_supply,
      createdAt,
      items: items.map((item) => ({
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        lineTotal: Number(item.price) * Number(item.quantity),
        toppings: (item.toppings ?? []).map((topping) => ({
          name: topping.name,
          price: Number(topping.price),
          quantity: Number(topping.quantity),
          lineTotal: Number(topping.price) * Number(topping.quantity),
        })),
      })),
    },
  };
}
