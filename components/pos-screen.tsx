"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import { useFormStatus } from "react-dom";
import { completeBill, type BillState } from "@/app/pos/actions";
import { PrintBillModal } from "@/components/print-bill-modal";
import type { BillSettings } from "@/types/bill-settings";
import type { TaxSettings } from "@/types/tax-settings";
import type {
  CartItem,
  CartTopping,
  Coupon,
  Product,
} from "@/types/pos";

const initialState: BillState = {
  status: "idle",
  message: "",
};

function createCartId() {
  return crypto.randomUUID();
}

export function PosScreen({
  products,
  toppings,
  coupons,
  billSettings, taxSettings,
}: {
  products: Product[]; toppings: Product[]; coupons: Coupon[]; billSettings: BillSettings; taxSettings: TaxSettings;
}) {
  const categories = [
    "All",
    ...Array.from(new Set(products.map((product) => product.category))),
  ];

  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [couponId, setCouponId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "upi" | "card" | ""
  >("");
  const [state, formAction] = useActionState(completeBill, initialState);
  const [billToPrint, setBillToPrint] = useState(state.printableBill);

  useEffect(() => {
    if (state.status === "success" && state.printableBill) {
      setBillToPrint(state.printableBill);
      setCart([]);
      setSelectedCartId(null);
      setCustomerName("");
      setCustomerPhone("");
      setCouponId("");
      setPaymentMethod("");
    }
  }, [state]);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch =
        activeCategory === "All" || product.category === activeCategory;
      const searchMatch = product.name
        .toLowerCase()
        .includes(query.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [activeCategory, products, query]);

  const selectedItem =
    cart.find((item) => item.cartId === selectedCartId) ?? null;

  const subtotal = cart.reduce((sum, item) => {
    const base = item.price * item.quantity;
    const toppingTotal = item.toppings.reduce(
      (toppingSum, topping) =>
        toppingSum + topping.price * topping.quantity,
      0
    );
    return sum + base + toppingTotal;
  }, 0);

  const selectedCoupon = coupons.find((coupon) => coupon.id === couponId);
  let discount = 0;

  if (selectedCoupon && subtotal >= selectedCoupon.minimum_order) {
    discount =
      selectedCoupon.discount_type === "percentage"
        ? subtotal * (selectedCoupon.discount_value / 100)
        : selectedCoupon.discount_value;

    if (selectedCoupon.maximum_discount !== null) {
      discount = Math.min(discount, selectedCoupon.maximum_discount);
    }

    discount = Math.min(discount, subtotal);
  }

  const total = Math.max(0, subtotal - discount);
  const taxableValue = taxSettings.gst_enabled && taxSettings.prices_include_tax ? total / (1 + taxSettings.gst_rate / 100) : total;
  const totalTax = taxSettings.gst_enabled ? (taxSettings.prices_include_tax ? total - taxableValue : taxableValue * taxSettings.gst_rate / 100) : 0;
  const cgst = totalTax / 2; const sgst = totalTax / 2;

  function addProduct(product: Product) {
    const newItem: CartItem = {
      ...product,
      cartId: createCartId(),
      quantity: 1,
      toppings: [],
    };

    setCart((current) => [...current, newItem]);
    setSelectedCartId(newItem.cartId);
  }

  function addTopping(topping: Product) {
    if (!selectedCartId) return;

    setCart((current) =>
      current.map((item) => {
        if (item.cartId !== selectedCartId) return item;

        const existing = item.toppings.find(
          (cartTopping) => cartTopping.id === topping.id
        );

        if (existing) {
          return {
            ...item,
            toppings: item.toppings.map((cartTopping) =>
              cartTopping.id === topping.id
                ? {
                    ...cartTopping,
                    quantity: cartTopping.quantity + 1,
                  }
                : cartTopping
            ),
          };
        }

        const newTopping: CartTopping = {
          id: topping.id,
          cartId: createCartId(),
          name: topping.name,
          price: topping.price,
          quantity: 1,
        };

        return {
          ...item,
          toppings: [...item.toppings, newTopping],
        };
      })
    );
  }

  function changeItemQuantity(cartId: string, amount: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function changeToppingQuantity(
    parentCartId: string,
    toppingCartId: string,
    amount: number
  ) {
    setCart((current) =>
      current.map((item) => {
        if (item.cartId !== parentCartId) return item;

        return {
          ...item,
          toppings: item.toppings
            .map((topping) =>
              topping.cartId === toppingCartId
                ? { ...topping, quantity: topping.quantity + amount }
                : topping
            )
            .filter((topping) => topping.quantity > 0),
        };
      })
    );
  }

  function removeItem(cartId: string) {
    setCart((current) => current.filter((item) => item.cartId !== cartId));
    if (selectedCartId === cartId) {
      setSelectedCartId(null);
    }
  }

  return (
    <>
      {billToPrint && (
        <PrintBillModal
          bill={billToPrint}
          settings={billSettings}
          onClose={() => setBillToPrint(undefined)}
        />
      )}

      <form action={formAction}>
        <input type="hidden" name="items" value={JSON.stringify(cart)} />
        <input type="hidden" name="payment_method" value={paymentMethod} />
        <input type="hidden" name="coupon_id" value={couponId} />

        {state.message && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${
              state.status === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {state.status === "success" && <CheckCircle2 size={18} />}
            {state.message}
          </div>
        )}

        <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b48a45]">
                    Create Order
                  </p>
                  <h2 className="text-2xl font-bold">Select Products</h2>
                </div>

                <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#eadfcf] bg-white px-4 lg:w-80">
                  <Search size={19} />
                  <input
                    className="w-full bg-transparent py-3 outline-none"
                    placeholder="Search menu"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>

              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeCategory === category
                        ? "bg-[#3b2418] text-white shadow-sm"
                        : "border border-[#eadfcf] bg-white hover:border-[#b48a45]"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="group min-h-36 rounded-2xl border border-[#eadfcf] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#b48a45] hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-lg bg-[#fff5df] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#9b6f31]">
                        {product.category}
                      </span>
                      <Plus
                        size={20}
                        className="rounded-full bg-[#3b2418] p-1 text-white opacity-70 group-hover:opacity-100"
                      />
                    </div>
                    <span className="mt-4 block font-bold leading-tight">
                      {product.name}
                    </span>
                    <span className="mt-3 block text-xl font-bold">
                      ₹{product.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-[#3b2418] p-2 text-white">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Topping Builder</h3>
                  <p className="text-sm text-[#806b5e]">
                    {selectedItem
                      ? `Adding toppings to ${selectedItem.name}`
                      : "Select a main item from the cart first"}
                  </p>
                </div>
              </div>

              {selectedItem ? (
                toppings.length ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {toppings.map((topping) => (
                      <button
                        key={topping.id}
                        type="button"
                        onClick={() => addTopping(topping)}
                        className="rounded-2xl border border-[#eadfcf] bg-white p-4 text-left transition hover:border-[#b48a45] hover:shadow-sm"
                      >
                        <span className="block font-bold">{topping.name}</span>
                        <span className="mt-2 block text-sm font-semibold text-[#9b6f31]">
                          + ₹{topping.price}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#d9c8b3] p-8 text-center text-sm text-[#806b5e]">
                    No topping products are available.
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-dashed border-[#d9c8b3] p-8 text-center text-sm text-[#806b5e]">
                  Tap a main product in the cart to attach toppings.
                </div>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-sm 2xl:sticky 2xl:top-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-[#3b2418] p-2 text-white">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Current Bill</h3>
                <p className="text-xs text-[#806b5e]">
                  Select an item to add toppings
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <UserRound size={16} />
                  Customer name
                </span>
                <input
                  name="customer_name"
                  required
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Enter customer name"
                  className="w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  Mobile number
                </span>
                <input
                  name="customer_phone"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(event) =>
                    setCustomerPhone(event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="10-digit number"
                  className="w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]"
                />
              </label>
            </div>

            <div className="my-5 max-h-[38vh] space-y-3 overflow-y-auto pr-1">
              {cart.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#d9c8b3] p-8 text-center text-sm text-[#806b5e]">
                  Select products to start the bill.
                </div>
              )}

              {cart.map((item) => {
                const itemToppingsTotal = item.toppings.reduce(
                  (sum, topping) => sum + topping.price * topping.quantity,
                  0
                );

                return (
                  <div
                    key={item.cartId}
                    onClick={() => setSelectedCartId(item.cartId)}
                    className={`cursor-pointer rounded-2xl border bg-white p-3 transition ${
                      selectedCartId === item.cartId
                        ? "border-[#3b2418] ring-2 ring-[#3b2418]/10"
                        : "border-[#eadfcf]"
                    }`}
                  >
                    <div className="flex justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2">
                        <ChevronRight
                          size={17}
                          className={`mt-0.5 shrink-0 ${
                            selectedCartId === item.cartId
                              ? "text-[#3b2418]"
                              : "text-[#b9a997]"
                          }`}
                        />
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-[#806b5e]">
                            ₹{item.price} each
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeItem(item.cartId);
                        }}
                        className="text-[#806b5e] hover:text-red-700"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="rounded-full border p-1"
                          onClick={(event) => {
                            event.stopPropagation();
                            changeItemQuantity(item.cartId, -1);
                          }}
                        >
                          <Minus size={15} />
                        </button>
                        <span className="min-w-5 text-center font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="rounded-full border p-1"
                          onClick={(event) => {
                            event.stopPropagation();
                            changeItemQuantity(item.cartId, 1);
                          }}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      <p className="font-bold">
                        ₹{item.price * item.quantity + itemToppingsTotal}
                      </p>
                    </div>

                    {item.toppings.length > 0 && (
                      <div className="mt-3 space-y-2 border-l-2 border-[#d8c5aa] pl-3">
                        {item.toppings.map((topping) => (
                          <div
                            key={topping.cartId}
                            className="flex items-center justify-between gap-3 rounded-xl bg-[#fffaf1] px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-semibold">
                                + {topping.name}
                              </p>
                              <p className="text-xs text-[#806b5e]">
                                ₹{topping.price} each
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="rounded-full border bg-white p-1"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  changeToppingQuantity(
                                    item.cartId,
                                    topping.cartId,
                                    -1
                                  );
                                }}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="min-w-4 text-center text-sm font-bold">
                                {topping.quantity}
                              </span>
                              <button
                                type="button"
                                className="rounded-full border bg-white p-1"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  changeToppingQuantity(
                                    item.cartId,
                                    topping.cartId,
                                    1
                                  );
                                }}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Tag size={16} />
                Apply coupon
              </span>
              <select
                value={couponId}
                onChange={(event) => setCouponId(event.target.value)}
                className="w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none"
              >
                <option value="">No coupon</option>
                {coupons.map((coupon) => (
                  <option key={coupon.id} value={coupon.id}>
                    {coupon.code} —{" "}
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}% off`
                      : `₹${coupon.discount_value} off`}
                  </option>
                ))}
              </select>
            </label>

            <div className="my-5 space-y-2 border-y border-[#eadfcf] py-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#806b5e]">Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#806b5e]">Coupon discount</span>
                <span className="font-semibold text-green-700">
                  − ₹{discount.toFixed(2)}
                </span>
              </div>
              {taxSettings.gst_enabled && <><div className="flex justify-between"><span className="text-[#806b5e]">Taxable value</span><span>₹{taxableValue.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-[#806b5e]">CGST {(taxSettings.gst_rate/2).toFixed(2)}%</span><span>₹{cgst.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-[#806b5e]">SGST {(taxSettings.gst_rate/2).toFixed(2)}%</span><span>₹{sgst.toFixed(2)}</span></div></>}
              <div className="flex justify-between pt-2 text-xl font-bold"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              {taxSettings.gst_enabled&&taxSettings.prices_include_tax&&<p className="pt-1 text-right text-xs text-[#806b5e]">Inclusive of {taxSettings.gst_rate}% GST</p>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["cash", "upi", "card"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-xl border py-3 text-sm font-bold uppercase disabled:opacity-40 ${
                    paymentMethod === method
                      ? "border-[#3b2418] bg-[#3b2418] text-white"
                      : "border-[#d9c8b3] bg-white"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <CompleteBillButton
              disabled={
                cart.length === 0 ||
                !customerName.trim() ||
                customerPhone.length !== 10 ||
                !paymentMethod
              }
            />

            <button
              type="button"
              disabled={!customerPhone || cart.length === 0}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#3b2418] py-3 font-semibold disabled:opacity-40"
            >
              <MessageCircle size={18} />
              WhatsApp Receipt
            </button>
          </aside>
        </section>
      </form>
    </>
  );
}

function CompleteBillButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3b2418] py-4 font-bold text-white disabled:opacity-40"
    >
      {pending ? "Saving Bill..." : "Complete Bill"}
    </button>
  );
}
