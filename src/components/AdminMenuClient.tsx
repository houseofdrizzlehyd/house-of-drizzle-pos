"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, Product, Topping } from "@/lib/types";
import { Spinner } from "@/components/Spinner";

type ProductWithToppings = Product & { toppings: Topping[] };

async function patchProduct(id: string, updates: Record<string, unknown>) {
  await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Upload failed.");
  return body.url as string;
}

export function AdminMenuClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithToppings[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingCategory, setAddingCategory] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/menu", { cache: "no-store" });
    if (!res.ok) return;
    const body = await res.json();
    setCategories(body.categories ?? []);
    setProducts(body.products ?? []);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setAddingCategory(true);
    try {
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setNewCategoryName("");
      await load();
    } finally {
      setAddingCategory(false);
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (!categoryFilter || p.category_id === categoryFilter)
  );

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <span className="text-sm sm:text-base font-medium text-chocolate">Menu items</span>
        <button onClick={() => setShowAddItem((v) => !v)} className="chip bg-gold text-chocolate font-medium">
          + Add item
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex items-center gap-2 bg-vanilla rounded-lg px-3 py-2 sm:flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items"
            className="bg-transparent flex-1 outline-none text-xs text-espresso placeholder:text-mocha"
          />
        </div>
        <div className="flex items-center gap-2 sm:flex-1">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="flex-1 bg-vanilla rounded-lg px-3 py-2 text-xs text-espresso outline-none placeholder:text-mocha"
          />
          <button
            onClick={addCategory}
            disabled={addingCategory}
            className="chip bg-vanilla text-mocha border border-gold flex-shrink-0 flex items-center gap-1.5 disabled:opacity-60"
          >
            {addingCategory && <Spinner className="h-3 w-3" />}
            Add category
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`chip ${!categoryFilter ? "bg-gold text-chocolate font-medium" : "bg-vanilla text-mocha"}`}
        >
          All categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id === categoryFilter ? null : c.id)}
            className={`chip ${
              categoryFilter === c.id ? "bg-gold text-chocolate font-medium" : "bg-vanilla text-mocha"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {showAddItem && (
        <div className="sm:max-w-md">
          <AddItemForm
            categories={categories}
            onCreated={() => {
              setShowAddItem(false);
              load();
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center pt-10">
          <Spinner className="h-6 w-6 text-mocha" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-3">
          {filtered.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              categoryName={categories.find((c) => c.id === product.category_id)?.name ?? ""}
              onChange={load}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-xs text-mocha text-center pt-6 lg:col-span-2">No items found.</div>
          )}
        </div>
      )}
    </div>
  );
}

function AddItemForm({
  categories,
  onCreated,
}: {
  categories: Category[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [gstRate, setGstRate] = useState("5");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    if (!name.trim() || !categoryId || !price) {
      setError("Name, category and price are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categoryId,
          price: Number(price),
          description,
          gstRate: Number(gstRate),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError("Could not create item.");
        return;
      }
      if (imageFile) {
        const url = await uploadImage(imageFile);
        await patchProduct(body.product.id, { image_url: url });
      }
      onCreated();
    } catch {
      setError("Could not create item.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card flex flex-col gap-2 mb-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name"
        className="bg-cream rounded-lg px-3 py-2 text-xs outline-none"
      />
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="bg-cream rounded-lg px-3 py-2 text-xs outline-none"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="Price (Rs)"
          className="bg-cream rounded-lg px-3 py-2 text-xs outline-none flex-1"
        />
        <input
          value={gstRate}
          onChange={(e) => setGstRate(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="GST %"
          className="bg-cream rounded-lg px-3 py-2 text-xs outline-none w-20"
        />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="bg-cream rounded-lg px-3 py-2 text-xs outline-none resize-none"
      />
      <label className="bg-cream rounded-lg px-3 py-2 text-xs outline-none text-mocha cursor-pointer">
        {imageFile ? `Photo selected: ${imageFile.name}` : "Choose photo (optional)"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>
      {error && <div className="text-[11px] text-strawberry">{error}</div>}
      <button
        onClick={submit}
        disabled={submitting}
        className="btn-primary text-xs py-2 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting && <Spinner className="h-3.5 w-3.5" />}
        {submitting ? "Creating..." : "Create item"}
      </button>
    </div>
  );
}

function ProductRow({
  product,
  categoryName,
  onChange,
}: {
  product: ProductWithToppings;
  categoryName: string;
  onChange: () => void;
}) {
  const [showToppings, setShowToppings] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [toppingName, setToppingName] = useState("");
  const [toppingPrice, setToppingPrice] = useState("");
  const [editName, setEditName] = useState(product.name);
  const [editPrice, setEditPrice] = useState(String(product.price));
  const [editDescription, setEditDescription] = useState(product.description ?? "");
  const [editGstRate, setEditGstRate] = useState(String(product.gst_rate));
  const [editImageUrl, setEditImageUrl] = useState(product.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [busyField, setBusyField] = useState<keyof Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingTopping, setAddingTopping] = useState(false);
  const [removingToppingId, setRemovingToppingId] = useState<string | null>(null);

  async function toggle(field: keyof Product) {
    setBusyField(field);
    try {
      await patchProduct(product.id, { [field]: !product[field] });
      onChange();
    } finally {
      setBusyField(null);
    }
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await patchProduct(product.id, {
        name: editName.trim(),
        price: Number(editPrice) || 0,
        description: editDescription.trim() || null,
        gst_rate: Number(editGstRate) || 0,
        image_url: editImageUrl.trim() || null,
      });
      setShowEdit(false);
      onChange();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoPick(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setEditImageUrl(url);
      await patchProduct(product.id, { image_url: url }); // saves the photo immediately
      onChange();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function addTopping() {
    if (!toppingName.trim()) return;
    setAddingTopping(true);
    try {
      await fetch("/api/admin/toppings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          name: toppingName.trim(),
          price: Number(toppingPrice) || 0,
        }),
      });
      setToppingName("");
      setToppingPrice("");
      onChange();
    } finally {
      setAddingTopping(false);
    }
  }

  async function removeTopping(id: string) {
    setRemovingToppingId(id);
    try {
      await fetch(`/api/admin/toppings/${id}`, { method: "DELETE" });
      onChange();
    } finally {
      setRemovingToppingId(null);
    }
  }

  return (
    <div className="card">
      <div className="flex gap-2.5">
        <div className="w-9 h-9 bg-belgian rounded-md flex-shrink-0 overflow-hidden">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <span className="text-xs font-medium text-espresso truncate">{product.name}</span>
            <span className="flex items-center gap-2 flex-shrink-0 ml-2">
              <button onClick={() => setShowEdit((v) => !v)} className="text-[11px] text-mocha">Edit</button>
              <button onClick={() => setShowToppings((v) => !v)} className="text-[11px] text-mocha">
                Toppings ({product.toppings.length})
              </button>
            </span>
          </div>
          <div className="text-[10px] text-mocha mt-0.5">
            {categoryName} &middot; Rs {Number(product.price).toFixed(0)} &middot; GST {Number(product.gst_rate)}%
          </div>
        </div>
      </div>

      {showEdit && (
        <div className="mt-2.5 pt-2.5 border-t border-gold/40 flex flex-col gap-1.5">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="bg-cream rounded-lg px-2 py-1.5 text-[11px] outline-none"
            placeholder="Name"
          />
          <div className="flex gap-1.5">
            <input
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              className="bg-cream rounded-lg px-2 py-1.5 text-[11px] outline-none flex-1"
              placeholder="Price (Rs)"
            />
            <input
              value={editGstRate}
              onChange={(e) => setEditGstRate(e.target.value.replace(/[^0-9.]/g, ""))}
              className="bg-cream rounded-lg px-2 py-1.5 text-[11px] outline-none w-16"
              placeholder="GST %"
            />
          </div>
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            className="bg-cream rounded-lg px-2 py-1.5 text-[11px] outline-none resize-none"
            placeholder="Description"
          />
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-belgian rounded-md flex-shrink-0 overflow-hidden">
              {editImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editImageUrl} alt="" className="w-full h-full object-cover" />
              ) : null}
            </div>
            <label className="chip bg-cream text-mocha border border-gold cursor-pointer flex items-center gap-1.5">
              {uploading && <Spinner className="h-3 w-3" />}
              {uploading ? "Uploading..." : "Upload photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => handlePhotoPick(e.target.files?.[0])}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          {uploadError && <div className="text-[11px] text-strawberry">{uploadError}</div>}
          <button
            onClick={saveEdit}
            disabled={saving}
            className="chip bg-gold text-chocolate font-medium self-start flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving && <Spinner className="h-3 w-3" />}
            Save
          </button>
        </div>
      )}

      <div className="flex gap-1.5 mt-2 flex-wrap">
        <ToggleChip
          label="Special"
          active={product.is_todays_special}
          busy={busyField === "is_todays_special"}
          onClick={() => toggle("is_todays_special")}
        />
        <ToggleChip
          label="Must try"
          active={product.is_must_try}
          busy={busyField === "is_must_try"}
          onClick={() => toggle("is_must_try")}
        />
        <ToggleChip
          label="Reward dish"
          active={product.is_reward_dish}
          busy={busyField === "is_reward_dish"}
          onClick={() => toggle("is_reward_dish")}
        />
        <button
          onClick={() => toggle("is_available")}
          disabled={busyField === "is_available"}
          className={`chip ml-auto font-medium flex items-center gap-1.5 disabled:opacity-60 ${
            product.is_available ? "bg-pistachio text-[#EAF3DE]" : "bg-mocha text-vanilla"
          }`}
        >
          {busyField === "is_available" && <Spinner className="h-3 w-3" />}
          {product.is_available ? "Available" : "Sold out"}
        </button>
      </div>

      {showToppings && (
        <div className="mt-2.5 pt-2.5 border-t border-gold/40 flex flex-col gap-1.5">
          {product.toppings.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-[11px]">
              <span className="text-espresso">{t.name} &middot; +Rs {Number(t.price).toFixed(0)}</span>
              <button
                onClick={() => removeTopping(t.id)}
                disabled={removingToppingId === t.id}
                className="text-mocha flex items-center gap-1 disabled:opacity-60"
              >
                {removingToppingId === t.id && <Spinner className="h-2.5 w-2.5" />}
                Remove
              </button>
            </div>
          ))}
          <div className="flex gap-1.5 mt-1">
            <input
              value={toppingName}
              onChange={(e) => setToppingName(e.target.value)}
              placeholder="Topping name"
              className="bg-cream rounded-lg px-2 py-1.5 text-[11px] outline-none flex-1"
            />
            <input
              value={toppingPrice}
              onChange={(e) => setToppingPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="+Rs"
              className="bg-cream rounded-lg px-2 py-1.5 text-[11px] outline-none w-16"
            />
            <button
              onClick={addTopping}
              disabled={addingTopping}
              className="chip bg-gold text-chocolate flex items-center gap-1.5 disabled:opacity-60"
            >
              {addingTopping && <Spinner className="h-3 w-3" />}
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleChip({
  label,
  active,
  busy = false,
  onClick,
}: {
  label: string;
  active: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`chip flex items-center gap-1.5 disabled:opacity-60 ${
        active ? "bg-gold text-chocolate font-medium" : "bg-cream text-mocha border border-gold"
      }`}
    >
      {busy && <Spinner className="h-3 w-3" />}
      {label}
    </button>
  );
}
