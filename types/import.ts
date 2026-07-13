export type ImportRow = {
  rowNumber: number;
  category: string;
  productName: string;
  price: number;
  isTopping: boolean;
  active: boolean;
};

export type ImportResult = {
  status: "idle" | "success" | "error";
  message: string;
  categoriesCreated?: number;
  productsCreated?: number;
  productsUpdated?: number;
};
