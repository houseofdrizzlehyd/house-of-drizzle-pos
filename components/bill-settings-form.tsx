"use client";

import { useMemo, useState } from "react";
import { ImagePlus, ReceiptText } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import type { BillSettings } from "@/types/bill-settings";
import { saveBillSettings } from "@/app/admin/bill-settings/actions";

export function BillSettingsForm({
  initialSettings,
}: {
  initialSettings: BillSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [logoPreview, setLogoPreview] = useState(initialSettings.logo_data_url);
  const [removeLogo, setRemoveLogo] = useState(false);

  const previewFontSize = useMemo(() => {
    if (settings.receipt_font_size === "small") return "10px";
    if (settings.receipt_font_size === "large") return "14px";
    return "12px";
  }, [settings.receipt_font_size]);

  function setBoolean(name: keyof BillSettings, value: boolean) {
    setSettings((current) => ({ ...current, [name]: value }));
  }

  return (
    <form action={saveBillSettings} encType="multipart/form-data">
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ReceiptText size={22} />
              <div>
                <h3 className="text-lg font-bold">Business details</h3>
                <p className="text-sm text-[#806b5e]">
                  These details appear at the top of every receipt.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Business name">
                <input
                  name="business_name"
                  required
                  value={settings.business_name}
                  onChange={(event) =>
                    setSettings({ ...settings, business_name: event.target.value })
                  }
                  className="input"
                />
              </Field>

              <Field label="Tagline">
                <input
                  name="tagline"
                  value={settings.tagline ?? ""}
                  onChange={(event) =>
                    setSettings({ ...settings, tagline: event.target.value })
                  }
                  className="input"
                />
              </Field>

              <Field label="GST number">
                <input
                  name="gst_number"
                  value={settings.gst_number ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      gst_number: event.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Example: 29ABCDE1234F1Z5"
                  className="input uppercase"
                />
              </Field>

              <Field label="Business phone">
                <input
                  name="phone"
                  value={settings.phone ?? ""}
                  onChange={(event) =>
                    setSettings({ ...settings, phone: event.target.value })
                  }
                  className="input"
                />
              </Field>

              <Field label="Address" wide>
                <textarea
                  name="address"
                  rows={3}
                  value={settings.address ?? ""}
                  onChange={(event) =>
                    setSettings({ ...settings, address: event.target.value })
                  }
                  className="input resize-none"
                />
              </Field>

              <Field label="Footer message" wide>
                <input
                  name="footer_message"
                  value={settings.footer_message ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      footer_message: event.target.value,
                    })
                  }
                  className="input"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ImagePlus size={22} />
              <div>
                <h3 className="text-lg font-bold">Receipt logo</h3>
                <p className="text-sm text-[#806b5e]">
                  Use a simple high-contrast logo for thermal printing.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-28 w-44 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#d9c8b3] bg-white p-3">
                {logoPreview && !removeLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Bill logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-center text-xs text-[#806b5e]">
                    No bill logo
                  </span>
                )}
              </div>

              <div className="flex-1">
                <input
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="block w-full text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setRemoveLogo(false);
                    setLogoPreview(URL.createObjectURL(file));
                  }}
                />
                <p className="mt-2 text-xs text-[#806b5e]">
                  PNG, JPG or WebP. Maximum 500 KB.
                </p>

                <label className="mt-3 flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="remove_logo"
                    checked={removeLogo}
                    onChange={(event) => {
                      setRemoveLogo(event.target.checked);
                      if (event.target.checked) setLogoPreview(null);
                    }}
                  />
                  Remove current logo
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-sm">
            <h3 className="text-lg font-bold">Layout and appearance</h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Paper width">
                <select
                  name="paper_width"
                  value={settings.paper_width}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      paper_width: Number(event.target.value) as 58 | 80,
                    })
                  }
                  className="input"
                >
                  <option value="80">80 mm / 3 inch</option>
                  <option value="58">58 mm / 2 inch</option>
                </select>
              </Field>

              <Field label="Header alignment">
                <select
                  name="header_alignment"
                  value={settings.header_alignment}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      header_alignment: event.target.value as
                        | "left"
                        | "center"
                        | "right",
                    })
                  }
                  className="input"
                >
                  <option value="left">Left</option>
                  <option value="center">Centre</option>
                  <option value="right">Right</option>
                </select>
              </Field>

              <Field label="Font size">
                <select
                  name="receipt_font_size"
                  value={settings.receipt_font_size}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      receipt_font_size: event.target.value as
                        | "small"
                        | "medium"
                        | "large",
                    })
                  }
                  className="input"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </Field>

              <Field label="Divider style">
                <select
                  name="divider_style"
                  value={settings.divider_style}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      divider_style: event.target.value as
                        | "dashed"
                        | "solid"
                        | "none",
                    })
                  }
                  className="input"
                >
                  <option value="dashed">Dashed</option>
                  <option value="solid">Solid</option>
                  <option value="none">None</option>
                </select>
              </Field>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Toggle
                name="show_logo"
                label="Show logo"
                checked={settings.show_logo}
                onChange={(value) => setBoolean("show_logo", value)}
              />
              <Toggle
                name="show_tagline"
                label="Show tagline"
                checked={settings.show_tagline}
                onChange={(value) => setBoolean("show_tagline", value)}
              />
              <Toggle
                name="show_address"
                label="Show address"
                checked={settings.show_address}
                onChange={(value) => setBoolean("show_address", value)}
              />
              <Toggle
                name="show_phone"
                label="Show business phone"
                checked={settings.show_phone}
                onChange={(value) => setBoolean("show_phone", value)}
              />
              <Toggle
                name="show_gst"
                label="Show GST number"
                checked={settings.show_gst}
                onChange={(value) => setBoolean("show_gst", value)}
              />
              <Toggle
                name="show_customer_name"
                label="Show customer name"
                checked={settings.show_customer_name}
                onChange={(value) => setBoolean("show_customer_name", value)}
              />
              <Toggle
                name="show_customer_phone"
                label="Show customer number"
                checked={settings.show_customer_phone}
                onChange={(value) => setBoolean("show_customer_phone", value)}
              />
              <Toggle
                name="show_coupon"
                label="Show coupon"
                checked={settings.show_coupon}
                onChange={(value) => setBoolean("show_coupon", value)}
              />
              <Toggle
                name="show_payment_method"
                label="Show payment method"
                checked={settings.show_payment_method}
                onChange={(value) => setBoolean("show_payment_method", value)}
              />
              <Toggle
                name="show_item_rate"
                label="Show item rate"
                checked={settings.show_item_rate}
                onChange={(value) => setBoolean("show_item_rate", value)}
              />
            </div>
          </section>

          <SubmitButton
            idleLabel="Save Bill Design"
            pendingLabel="Saving Bill Design..."
            className="w-full rounded-2xl bg-[#3b2418] py-4 font-bold text-white"
          />
        </div>

        <aside className="h-fit rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-sm 2xl:sticky 2xl:top-6">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.15em] text-[#b48a45]">
            Live Preview
          </p>

          <div className="overflow-x-auto rounded-2xl bg-[#e8e1d6] p-4">
            <section
              className="mx-auto bg-white p-4 font-mono text-black shadow"
              style={{
                width: settings.paper_width === 58 ? "58mm" : "80mm",
                fontSize: previewFontSize,
                lineHeight: 1.35,
              }}
            >
              <div style={{ textAlign: settings.header_alignment }}>
                {settings.show_logo && logoPreview && !removeLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt=""
                    className="mx-auto mb-2 max-h-14 max-w-[70%] object-contain grayscale"
                  />
                )}
                <strong className="text-base">{settings.business_name}</strong>
                {settings.show_tagline && settings.tagline && (
                  <p className="my-1">{settings.tagline}</p>
                )}
                {settings.show_address && settings.address && (
                  <p className="my-1 whitespace-pre-line">{settings.address}</p>
                )}
                {settings.show_phone && settings.phone && (
                  <p className="my-1">Phone: {settings.phone}</p>
                )}
                {settings.show_gst && settings.gst_number && (
                  <p className="my-1">GSTIN: {settings.gst_number}</p>
                )}
              </div>

              <PreviewDivider style={settings.divider_style} />
              <Row left="Bill No." right="#1001" />
              <Row left="Date" right="11 Jul 2026, 8:30 pm" />
              {settings.show_customer_name && (
                <Row left="Customer" right="Sample Customer" />
              )}
              {settings.show_customer_phone && (
                <Row left="Mobile" right="9876543210" />
              )}
              {settings.show_payment_method && (
                <Row left="Payment" right="UPI" />
              )}

              <PreviewDivider style={settings.divider_style} />
              <Row left="Chocolate Waffle" right="₹179.00" bold />
              {settings.show_item_rate && (
                <Row left="1 × ₹179.00" right="" />
              )}
              <Row left="Vanilla Scoop" right="₹79.00" bold />
              {settings.show_item_rate && <Row left="1 × ₹79.00" right="" />}

              <PreviewDivider style={settings.divider_style} />
              <Row left="Subtotal" right="₹258.00" />
              {settings.show_coupon && (
                <Row left="Discount (WELCOME10)" right="-₹25.80" />
              )}
              <div className="mt-2 flex justify-between text-base font-bold">
                <span>TOTAL</span>
                <span>₹232.20</span>
              </div>

              <PreviewDivider style={settings.divider_style} />
              <div className="text-center">
                <p>{settings.footer_message || "Thank you!"}</p>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </form>
  );
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "block md:col-span-2" : "block"}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-[#eadfcf] bg-white p-3 text-sm font-medium">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function Row({
  left,
  right,
  bold = false,
}: {
  left: string;
  right: string;
  bold?: boolean;
}) {
  return (
    <div className={`my-1 flex justify-between gap-3 ${bold ? "font-bold" : ""}`}>
      <span>{left}</span>
      <span className="text-right">{right}</span>
    </div>
  );
}

function PreviewDivider({
  style,
}: {
  style: BillSettings["divider_style"];
}) {
  if (style === "none") return <div className="my-2" />;

  return (
    <div
      className="my-2 border-t border-black"
      style={{ borderTopStyle: style }}
    />
  );
}
