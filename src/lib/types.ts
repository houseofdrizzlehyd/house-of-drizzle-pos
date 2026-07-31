export type Category = {
  id: string;
  name: string;
  sort_order: number;
};

export type Topping = {
  id: string;
  product_id: string;
  name: string;
  price: number;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number; // tax-inclusive, in Rs
  gst_rate: number; // percent, e.g. 5 or 18
  image_url: string | null;
  is_available: boolean;
  is_todays_special: boolean;
  is_must_try: boolean;
  is_reward_dish: boolean;
  toppings?: Topping[];
};

export type OrderStatus = "placed" | "preparing" | "ready" | "completed";

export type OrderSource = "web" | "pos";

export type OrderType = "dine_in" | "delivery";

export type Coupon = {
  id: string;
  name: string;
  discount_percent: number;
  is_active: boolean;
  show_on_pos: boolean;
  show_on_web: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  order_number: number;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  status: OrderStatus;
  is_paid: boolean;
  subtotal: number;
  reward_applied: "none" | "free_dish";
  reward_product_id: string | null;
  source: OrderSource;
  coupon_id: string | null;
  discount_amount: number;
  order_type: OrderType;
  delivery_address: string | null;
  delivery_charge: number;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
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

export type CartLine = {
  key: string; // product_id + sorted topping ids, for dedupe
  product: Product;
  quantity: number;
  selectedToppings: Topping[];
};
