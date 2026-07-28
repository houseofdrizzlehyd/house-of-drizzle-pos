// One-off bulk import of the initial menu spreadsheet into Supabase.
//
// Usage:
//   node --env-file=.env.local scripts/import-menu.mjs ./house_of_drizzle_menu_import.xlsx
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set
// (the service role key is required because this bypasses RLS to write
// categories/products/toppings directly — never expose that key to the browser).

import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node --env-file=.env.local scripts/import-menu.mjs <path-to-xlsx>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const workbook = xlsx.readFile(filePath);
const menuSheet = xlsx.utils.sheet_to_json(workbook.Sheets["Menu items"], { defval: "" });
const addonSheet = workbook.Sheets["Add-ons"]
  ? xlsx.utils.sheet_to_json(workbook.Sheets["Add-ons"], { defval: "" })
  : [];

// Extra-scoop pricing by ice cream tier, read from the Add-ons tab (falls
// back to the House of Drizzle defaults if that tab is missing or edited).
const scoopPriceByTier = { regular: 40, premium: 60, signature: 80 };
for (const row of addonSheet) {
  const applies = String(row["Applies to"] ?? "").toLowerCase();
  for (const tier of Object.keys(scoopPriceByTier)) {
    if (applies.includes(tier)) scoopPriceByTier[tier] = Number(row["Extra price (Rs)"]) || scoopPriceByTier[tier];
  }
}

function truthy(v) {
  return String(v).trim().toUpperCase() === "Y";
}

async function getOrCreateCategory(name, sortOrder) {
  const { data: existing } = await supabase.from("categories").select("*").eq("name", name).maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function main() {
  const categoryCache = new Map();
  let sortOrder = 0;
  let productsCreated = 0;
  let toppingsCreated = 0;

  for (const row of menuSheet) {
    const categoryName = String(row["Category"] ?? "").trim();
    const itemName = String(row["Item name"] ?? "").trim();
    if (!categoryName || !itemName) continue;

    if (!categoryCache.has(categoryName)) {
      sortOrder += 1;
      categoryCache.set(categoryName, await getOrCreateCategory(categoryName, sortOrder));
    }
    const category = categoryCache.get(categoryName);

    const price = Number(row["Price (Rs, tax incl.)"]) || 0;
    const description = String(row["Description"] ?? "").trim() || null;
    const gstRate = Number(row["GST %"]) || 5;
    const imageFilename = String(row["Image filename"] ?? "").trim();

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        category_id: category.id,
        name: itemName,
        description,
        price,
        gst_rate: gstRate,
        image_url: imageFilename || null, // placeholder — replace with the real hosted URL later
        is_todays_special: truthy(row["Today's special (Y/N)"]),
        is_must_try: truthy(row["Must try (Y/N)"]),
        is_reward_dish: truthy(row["Reward dish (Y/N)"]),
        is_available: String(row["Available (Y/N)"]).trim().toUpperCase() !== "N",
      })
      .select()
      .single();

    if (error) {
      console.error(`Failed to import "${itemName}":`, error.message);
      continue;
    }
    productsCreated += 1;

    // Auto-attach the extra-scoop topping to ice cream items, based on the
    // tier named anywhere in the item name (e.g. "Vanilla (regular)" or
    // "Vanilla - Regular").
    if (categoryName.toLowerCase() === "ice creams") {
      const tierMatch = itemName.match(/(regular|premium|signature)/i);
      const tier = tierMatch?.[1]?.toLowerCase();
      if (tier && scoopPriceByTier[tier] != null) {
        const { error: toppingError } = await supabase
          .from("toppings")
          .insert({ product_id: product.id, name: "Extra scoop", price: scoopPriceByTier[tier] });
        if (!toppingError) toppingsCreated += 1;
      }
    }
  }

  console.log(`Done. Categories: ${categoryCache.size}, products: ${productsCreated}, toppings: ${toppingsCreated}.`);
  console.log("Image filenames were carried over as placeholders — replace product.image_url with real hosted image URLs from the admin menu manager once photos are uploaded.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
