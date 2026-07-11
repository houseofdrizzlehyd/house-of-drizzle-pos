export type BillSettings = {
  id: number;
  business_name: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  gst_number: string | null;
  footer_message: string | null;
  logo_data_url: string | null;
  show_logo: boolean;
  show_tagline: boolean;
  show_address: boolean;
  show_phone: boolean;
  show_gst: boolean;
  show_customer_name: boolean;
  show_customer_phone: boolean;
  show_coupon: boolean;
  show_payment_method: boolean;
  show_item_rate: boolean;
  header_alignment: "left" | "center" | "right";
  receipt_font_size: "small" | "medium" | "large";
  divider_style: "dashed" | "solid" | "none";
  paper_width: 58 | 80;
};

export const defaultBillSettings: BillSettings = {
  id: 1,
  business_name: "House of Drizzle",
  tagline: "Sip. Scoop. Drizzle. Repeat.",
  address: null,
  phone: null,
  gst_number: null,
  footer_message: "Thank you for visiting!",
  logo_data_url: null,
  show_logo: true,
  show_tagline: true,
  show_address: true,
  show_phone: true,
  show_gst: true,
  show_customer_name: true,
  show_customer_phone: true,
  show_coupon: true,
  show_payment_method: true,
  show_item_rate: true,
  header_alignment: "center",
  receipt_font_size: "medium",
  divider_style: "dashed",
  paper_width: 80,
};
