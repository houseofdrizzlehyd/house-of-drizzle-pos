export type TaxSettings = {
  id: number; gst_enabled: boolean; gst_rate: number; prices_include_tax: boolean;
  invoice_prefix: string; state_name: string; place_of_supply: string;
};
export const defaultTaxSettings: TaxSettings = {
  id: 1, gst_enabled: true, gst_rate: 5, prices_include_tax: true,
  invoice_prefix: "HOD", state_name: "Telangana", place_of_supply: "Telangana",
};
