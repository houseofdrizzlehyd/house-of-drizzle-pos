export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  isTopping: boolean;
};

export type CartTopping = {
  id: string;
  cartId: string;
  name: string;
  price: number;
  quantity: number;
};

export type CartItem = Product & {
  cartId: string;
  quantity: number;
  toppings: CartTopping[];
};

export type Coupon = {
  id: string;
  code: string;
  name: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order: number;
  maximum_discount: number | null;
};
