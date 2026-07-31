import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { round2 } from "@/lib/tax";
import { requireAdmin } from "@/lib/admin-auth";
import { distanceFromStoreKm } from "@/lib/geo";

type IncomingLine = {
  productId: string;
  quantity: number;
  toppingIds: string[];
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const mobile = String(body.mobile ?? "").trim();
  const lines: IncomingLine[] = Array.isArray(body.lines) ? body.lines : [];
  const source: "web" | "pos" = body.source === "pos" ? "pos" : "web";
  const couponId = body.couponId ? String(body.couponId) : null;
  const markPaid = source === "pos" && Boolean(body.markPaid);
  const orderType: "dine_in" | "delivery" = body.orderType === "delivery" ? "delivery" : "dine_in";
  const deliveryAddress = orderType === "delivery" ? String(body.deliveryAddress ?? "").trim() : null;
  const deliveryLat = orderType === "delivery" && Number.isFinite(Number(body.deliveryLat)) ? Number(body.deliveryLat) : null;
  const deliveryLng = orderType === "delivery" && Number.isFinite(Number(body.deliveryLng)) ? Number(body.deliveryLng) : null;

  // POS orders are created by an authenticated admin/staff session; web
  // orders come from anonymous customers and skip this check entirely.
  if (source === "pos") {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!/^[0-9]{10}$/.test(mobile)) {
    return NextResponse.json({ error: "A valid 10-digit mobile number is required." }, { status: 400 });
  }
  if (lines.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }
  if (orderType === "delivery" && !deliveryAddress) {
    return NextResponse.json({ error: "A delivery address is required." }, { status: 400 });
  }
  if (orderType === "delivery" && (deliveryLat === null || deliveryLng === null)) {
    return NextResponse.json({ error: "A delivery pin location is required." }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Re-fetch every product and topping server-side — never trust client-sent prices.
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds);

  if (productsError || !products) {
    return NextResponse.json({ error: "Could not load menu items." }, { status: 500 });
  }

  const toppingIds = [...new Set(lines.flatMap((l) => l.toppingIds ?? []))];
  const { data: toppings } = toppingIds.length
    ? await supabase.from("toppings").select("*").in("id", toppingIds)
    : { data: [] as { id: string; product_id: string; name: string; price: number }[] };

  const productById = new Map(products.map((p) => [p.id, p]));
  const toppingById = new Map((toppings ?? []).map((t) => [t.id, t]));

  type ItemRow = {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    topping_names: string[];
    topping_price: number;
    line_total: number;
    gst_rate: number;
    is_free_reward: boolean;
  };

  const orderItems: ItemRow[] = [];

  for (const line of lines) {
    const product = productById.get(line.productId);
    if (!product || !product.is_available) {
      return NextResponse.json({ error: `An item in your cart is no longer available.` }, { status: 409 });
    }
    const quantity = Math.max(1, Number(line.quantity) || 1);
    const selectedToppings = (line.toppingIds ?? [])
      .map((id) => toppingById.get(id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t) && t!.product_id === product.id);

    const toppingPrice = selectedToppings.reduce((s, t) => s + Number(t.price), 0);
    const unitPrice = Number(product.price);
    const lineTotal = (unitPrice + toppingPrice) * quantity;

    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: unitPrice,
      topping_names: selectedToppings.map((t) => t.name),
      topping_price: toppingPrice,
      line_total: lineTotal,
      gst_rate: Number(product.gst_rate),
      is_free_reward: false,
    });
  }

  // Find or create the customer by mobile number, and bump their order count.
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("*")
    .eq("mobile_number", mobile)
    .maybeSingle();

  let customerId: string;
  let orderCount: number;

  if (existingCustomer) {
    orderCount = existingCustomer.order_count + 1;
    customerId = existingCustomer.id;
    await supabase
      .from("customers")
      .update({ name, order_count: orderCount, updated_at: new Date().toISOString() })
      .eq("id", customerId);
  } else {
    orderCount = 1;
    const { data: created, error: createError } = await supabase
      .from("customers")
      .insert({ mobile_number: mobile, name, order_count: orderCount })
      .select()
      .single();
    if (createError || !created) {
      return NextResponse.json({ error: "Could not create customer record." }, { status: 500 });
    }
    customerId = created.id;
  }

  // Loyalty reward: every Nth order (default 6) gets one specific reward dish free.
  const { data: settingRow } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "reward_milestone_every_n_orders")
    .maybeSingle();
  const milestone = Number(settingRow?.value ?? 6) || 6;

  let rewardApplied: "none" | "free_dish" = "none";
  let rewardProductId: string | null = null;

  if (orderCount > 0 && orderCount % milestone === 0) {
    const { data: rewardProduct } = await supabase
      .from("products")
      .select("*")
      .eq("is_reward_dish", true)
      .eq("is_available", true)
      .limit(1)
      .maybeSingle();

    if (rewardProduct) {
      rewardApplied = "free_dish";
      rewardProductId = rewardProduct.id;
      orderItems.push({
        product_id: rewardProduct.id,
        product_name: rewardProduct.name,
        quantity: 1,
        unit_price: Number(rewardProduct.price),
        topping_names: [],
        topping_price: 0,
        line_total: 0,
        gst_rate: Number(rewardProduct.gst_rate),
        is_free_reward: true,
      });
    }
  }

  // Coupon: validate server-side against the requested channel — never
  // trust a client-sent discount percent. Free reward items are already 0
  // and are left untouched; the discount scales only the paid line totals.
  let appliedCouponId: string | null = null;
  let discountAmount = 0;

  if (couponId) {
    const { data: coupon } = await supabase.from("coupons").select("*").eq("id", couponId).maybeSingle();
    const channelOk = coupon && (source === "pos" ? coupon.show_on_pos : coupon.show_on_web);
    if (coupon && coupon.is_active && channelOk) {
      appliedCouponId = coupon.id;
      const factor = 1 - Number(coupon.discount_percent) / 100;
      for (const item of orderItems) {
        if (item.is_free_reward) continue;
        const scaled = round2(item.line_total * factor);
        discountAmount = round2(discountAmount + (item.line_total - scaled));
        item.line_total = scaled;
      }
    }
  }

  const subtotal = round2(orderItems.reduce((s, i) => s + i.line_total, 0));

  let deliveryCharge = 0;

  if (orderType === "delivery") {
    const { data: deliverySettingRows } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["delivery_minimum_order_amount", "delivery_charge_amount", "delivery_radius_km"]);
    const settingsByKey = new Map((deliverySettingRows ?? []).map((row) => [row.key, row.value]));
    const minimumOrderAmount = Number(settingsByKey.get("delivery_minimum_order_amount") ?? 200) || 200;
    deliveryCharge = Number(settingsByKey.get("delivery_charge_amount") ?? 0) || 0;
    const radiusKm = Number(settingsByKey.get("delivery_radius_km") ?? 5) || 5;

    if (subtotal < minimumOrderAmount) {
      return NextResponse.json(
        { error: `Delivery orders need a minimum of Rs ${minimumOrderAmount}.` },
        { status: 400 }
      );
    }

    // Never trust a client-sent distance — recompute from the pinned
    // coordinates against the store's fixed location.
    const km = distanceFromStoreKm(deliveryLat as number, deliveryLng as number);
    if (km > radiusKm) {
      return NextResponse.json(
        { error: `That location is outside our ${radiusKm}km delivery range.` },
        { status: 400 }
      );
    }
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      customer_name: name,
      customer_mobile: mobile,
      status: markPaid ? "preparing" : "placed",
      is_paid: markPaid,
      subtotal,
      reward_applied: rewardApplied,
      reward_product_id: rewardProductId,
      source,
      coupon_id: appliedCouponId,
      discount_amount: discountAmount,
      order_type: orderType,
      delivery_address: deliveryAddress,
      delivery_charge: deliveryCharge,
      delivery_lat: deliveryLat,
      delivery_lng: deliveryLng,
      ...(markPaid ? { paid_at: new Date().toISOString() } : {}),
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Could not place order. Please try again." }, { status: 500 });
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));

  if (itemsError) {
    return NextResponse.json({ error: "Could not save order items." }, { status: 500 });
  }

  return NextResponse.json({ orderId: order.id, orderNumber: order.order_number });
}
