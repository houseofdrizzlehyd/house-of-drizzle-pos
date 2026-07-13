"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ImportResult, ImportRow } from "@/types/import";

export async function importProducts(rows: ImportRow[]): Promise<ImportResult> {
  await requireProfile(["admin", "super_admin"]);

  if (!Array.isArray(rows) || rows.length === 0) {
    return { status: "error", message: "No valid rows were provided." };
  }

  if (rows.length > 2000) {
    return { status: "error", message: "A maximum of 2,000 rows can be imported at once." };
  }

  const cleanRows = rows.map((row) => ({
    rowNumber: Number(row.rowNumber),
    category: String(row.category ?? "").trim(),
    productName: String(row.productName ?? "").trim(),
    price: Number(row.price),
    isTopping: Boolean(row.isTopping),
    active: Boolean(row.active),
  }));

  const invalid = cleanRows.find(
    (row) =>
      !row.category ||
      !row.productName ||
      !Number.isFinite(row.price) ||
      row.price < 0
  );

  if (invalid) {
    return {
      status: "error",
      message: `Row ${invalid.rowNumber} contains invalid data.`,
    };
  }

  const supabase = await createClient();
  const categoryNames = Array.from(new Set(cleanRows.map((row) => row.category)));
  let categoriesCreated = 0;

  const { data: existingCategories, error: categoryReadError } = await supabase
    .from("categories")
    .select("id, name");

  if (categoryReadError) {
    return { status: "error", message: categoryReadError.message };
  }

  const categoryMap = new Map(
    (existingCategories ?? []).map((category) => [category.name.toLowerCase(), category.id])
  );

  for (const name of categoryNames) {
    const key = name.toLowerCase();
    if (categoryMap.has(key)) continue;

    const { data, error } = await supabase
      .from("categories")
      .insert({ name, is_active: true })
      .select("id")
      .single();

    if (error || !data) {
      return { status: "error", message: error?.message ?? `Could not create category ${name}.` };
    }

    categoryMap.set(key, data.id);
    categoriesCreated += 1;
  }

  const { data: existingProducts, error: productReadError } = await supabase
    .from("products")
    .select("id, name, category_id");

  if (productReadError) {
    return { status: "error", message: productReadError.message };
  }

  const productMap = new Map(
    (existingProducts ?? []).map((product) => [
      `${product.category_id}:${product.name.toLowerCase()}`,
      product.id,
    ])
  );

  let productsCreated = 0;
  let productsUpdated = 0;

  for (const row of cleanRows) {
    const categoryId = categoryMap.get(row.category.toLowerCase());
    if (!categoryId) {
      return { status: "error", message: `Category could not be resolved for row ${row.rowNumber}.` };
    }

    const key = `${categoryId}:${row.productName.toLowerCase()}`;
    const existingId = productMap.get(key);
    const payload = {
      name: row.productName,
      category_id: categoryId,
      price: row.price,
      is_topping: row.isTopping,
      is_active: row.active,
    };

    if (existingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", existingId);
      if (error) return { status: "error", message: error.message };
      productsUpdated += 1;
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (error || !data) return { status: "error", message: error?.message ?? `Could not import ${row.productName}.` };
      productMap.set(key, data.id);
      productsCreated += 1;
    }
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/import");
  revalidatePath("/pos");

  return {
    status: "success",
    message: "Excel import completed successfully.",
    categoriesCreated,
    productsCreated,
    productsUpdated,
  };
}
