"use client";

import { useCallback, useEffect, useState } from "react";
import type { Coupon } from "@/lib/types";
import { Spinner } from "@/components/Spinner";

async function patchCoupon(id: string, updates: Record<string, unknown>) {
  await fetch(`/api/admin/coupons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export function AdminCouponsClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/coupons", { cache: "no-store" });
    if (!res.ok) return;
    const body = await res.json();
    setCoupons(body.coupons ?? []);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <span className="text-sm sm:text-base font-medium text-chocolate">Coupons</span>
        <button onClick={() => setShowAdd((v) => !v)} className="chip bg-gold text-chocolate font-medium">
          + Add coupon
        </button>
      </div>

      {showAdd && (
        <div className="sm:max-w-md">
          <AddCouponForm
            onCreated={() => {
              setShowAdd(false);
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
          {coupons.map((coupon) => (
            <CouponRow key={coupon.id} coupon={coupon} onChange={load} />
          ))}
          {coupons.length === 0 && (
            <div className="text-xs text-mocha text-center pt-6 lg:col-span-2">No coupons yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

function AddCouponForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [showOnPos, setShowOnPos] = useState(true);
  const [showOnWeb, setShowOnWeb] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    const pct = Number(discountPercent);
    if (!name.trim() || !Number.isFinite(pct) || pct <= 0 || pct > 100) {
      setError("Name and a discount percent between 1 and 100 are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), discountPercent: pct, showOnPos, showOnWeb }),
      });
      if (!res.ok) {
        setError("Could not create coupon.");
        return;
      }
      onCreated();
    } catch {
      setError("Could not create coupon.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card flex flex-col gap-2 mb-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Coupon name (e.g. Festive 10%)"
        className="bg-cream rounded-lg px-3 py-2 text-xs outline-none"
      />
      <input
        value={discountPercent}
        onChange={(e) => setDiscountPercent(e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder="Discount %"
        className="bg-cream rounded-lg px-3 py-2 text-xs outline-none"
      />
      <div className="flex gap-4 px-1">
        <label className="flex items-center gap-1.5 text-xs text-espresso">
          <input type="checkbox" checked={showOnPos} onChange={(e) => setShowOnPos(e.target.checked)} />
          Show on POS
        </label>
        <label className="flex items-center gap-1.5 text-xs text-espresso">
          <input type="checkbox" checked={showOnWeb} onChange={(e) => setShowOnWeb(e.target.checked)} />
          Show on web menu
        </label>
      </div>
      {error && <div className="text-[11px] text-strawberry">{error}</div>}
      <button
        onClick={submit}
        disabled={submitting}
        className="btn-primary text-xs py-2 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting && <Spinner className="h-3.5 w-3.5" />}
        {submitting ? "Creating..." : "Create coupon"}
      </button>
    </div>
  );
}

function CouponRow({ coupon, onChange }: { coupon: Coupon; onChange: () => void }) {
  const [busyField, setBusyField] = useState<keyof Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function toggle(field: keyof Coupon) {
    setBusyField(field);
    try {
      await patchCoupon(coupon.id, { [toApiKey(field)]: !coupon[field] });
      onChange();
    } finally {
      setBusyField(null);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await fetch(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" });
      onChange();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <span className="text-xs font-medium text-espresso truncate block">{coupon.name}</span>
          <span className="text-[10px] text-mocha mt-0.5 block">{Number(coupon.discount_percent)}% off</span>
        </div>
        <button
          onClick={remove}
          disabled={deleting}
          className="text-[11px] text-strawberry flex-shrink-0 ml-2 flex items-center gap-1 disabled:opacity-60"
        >
          {deleting && <Spinner className="h-2.5 w-2.5" />}
          Delete
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        <Toggle
          label="Active"
          on={coupon.is_active}
          busy={busyField === "is_active"}
          onClick={() => toggle("is_active")}
        />
        <Toggle
          label="POS"
          on={coupon.show_on_pos}
          busy={busyField === "show_on_pos"}
          onClick={() => toggle("show_on_pos")}
        />
        <Toggle
          label="Web menu"
          on={coupon.show_on_web}
          busy={busyField === "show_on_web"}
          onClick={() => toggle("show_on_web")}
        />
      </div>
    </div>
  );
}

function toApiKey(field: keyof Coupon): string {
  const map: Partial<Record<keyof Coupon, string>> = {
    is_active: "isActive",
    show_on_pos: "showOnPos",
    show_on_web: "showOnWeb",
  };
  return map[field] ?? field;
}

function Toggle({
  label,
  on,
  busy = false,
  onClick,
}: {
  label: string;
  on: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`chip flex items-center gap-1.5 disabled:opacity-60 ${
        on ? "bg-gold text-chocolate font-medium" : "bg-vanilla text-mocha"
      }`}
    >
      {busy && <Spinner className="h-3 w-3" />}
      {label}
    </button>
  );
}
