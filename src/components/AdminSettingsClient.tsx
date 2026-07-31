"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";

type Settings = { deliveryMinimumOrderAmount: number; deliveryChargeAmount: number };

export function AdminSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [minimumOrderAmount, setMinimumOrderAmount] = useState("");
  const [deliveryChargeAmount, setDeliveryChargeAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: Settings) => {
        setMinimumOrderAmount(String(body.deliveryMinimumOrderAmount));
        setDeliveryChargeAmount(String(body.deliveryChargeAmount));
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setError(null);
    setSaved(false);
    const minimum = Number(minimumOrderAmount);
    const charge = Number(deliveryChargeAmount);
    if (!Number.isFinite(minimum) || minimum < 0) {
      return setError("Minimum order value must be a non-negative number.");
    }
    if (!Number.isFinite(charge) || charge < 0) {
      return setError("Delivery charge must be a non-negative number.");
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryMinimumOrderAmount: minimum, deliveryChargeAmount: charge }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save settings.");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-6">
        <div className="flex justify-center pt-10">
          <Spinner className="h-6 w-6 text-mocha" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="text-sm sm:text-base font-medium text-chocolate mb-3 sm:mb-5">Settings</div>

      <div className="card max-w-sm flex flex-col gap-3">
        <div className="text-xs font-medium text-chocolate">Delivery</div>

        <div>
          <div className="text-[11px] text-mocha mb-1">Minimum order value (Rs)</div>
          <input
            value={minimumOrderAmount}
            onChange={(e) => setMinimumOrderAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="w-full bg-cream rounded-lg px-3 py-2 text-xs outline-none"
          />
        </div>

        <div>
          <div className="text-[11px] text-mocha mb-1">Delivery charge (Rs)</div>
          <input
            value={deliveryChargeAmount}
            onChange={(e) => setDeliveryChargeAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="w-full bg-cream rounded-lg px-3 py-2 text-xs outline-none"
          />
        </div>

        {error && <div className="text-[11px] text-strawberry">{error}</div>}
        {saved && !error && <div className="text-[11px] text-pistachio">Saved.</div>}

        <button
          onClick={save}
          disabled={saving}
          className="btn-primary text-xs py-2 disabled:opacity-60 flex items-center justify-center gap-2 self-start px-6"
        >
          {saving && <Spinner className="h-3.5 w-3.5" />}
          Save
        </button>
      </div>
    </div>
  );
}
