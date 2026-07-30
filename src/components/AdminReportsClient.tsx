"use client";

import { useCallback, useEffect, useState } from "react";

type Report = {
  range: string;
  grossSales: number;
  ordersCount: number;
  avgOrderValue: number;
  rewardsGiven: number;
  discountsGiven: number;
  posOrdersCount: number;
  webOrdersCount: number;
  taxBreakup: { taxableValue: number; cgst: number; sgst: number; totalTax: number };
  topItems: { name: string; quantity: number }[];
};

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export function AdminReportsClient() {
  const [range, setRange] = useState("today");
  const [report, setReport] = useState<Report | null>(null);

  const load = useCallback(async (r: string) => {
    const res = await fetch(`/api/admin/reports?range=${r}`, { cache: "no-store" });
    if (!res.ok) return;
    setReport(await res.json());
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  function exportCsv() {
    if (!report) return;
    const rows = [
      ["Metric", "Value"],
      ["Range", range],
      ["Gross sales (Rs)", report.grossSales.toFixed(2)],
      ["Orders", String(report.ordersCount)],
      ["Average order value (Rs)", report.avgOrderValue.toFixed(2)],
      ["Rewards given (free dishes)", String(report.rewardsGiven)],
      ["Discounts given (Rs)", report.discountsGiven.toFixed(2)],
      ["Web orders", String(report.webOrdersCount)],
      ["POS orders", String(report.posOrdersCount)],
      ["Taxable value (Rs)", report.taxBreakup.taxableValue.toFixed(2)],
      ["CGST (Rs)", report.taxBreakup.cgst.toFixed(2)],
      ["SGST (Rs)", report.taxBreakup.sgst.toFixed(2)],
      ["Total tax collected (Rs)", report.taxBreakup.totalTax.toFixed(2)],
      [],
      ["Top items", "Quantity sold"],
      ...report.topItems.map((i) => [i.name, String(i.quantity)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `house-of-drizzle-report-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const maxQty = report?.topItems[0]?.quantity ?? 1;

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <span className="text-sm sm:text-base font-medium text-chocolate">Sales report</span>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`chip ${range === r.key ? "bg-gold text-chocolate font-medium" : "bg-vanilla text-mocha"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!report ? (
        <div className="text-xs text-mocha">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            <Metric label="Gross sales" value={`Rs ${report.grossSales.toFixed(0)}`} />
            <Metric label="Orders" value={String(report.ordersCount)} />
            <Metric label="Avg order value" value={`Rs ${report.avgOrderValue.toFixed(0)}`} />
            <Metric label="Rewards given" value={`${report.rewardsGiven} dishes`} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <Metric label="Discounts given" value={`Rs ${report.discountsGiven.toFixed(0)}`} />
            <Metric label="Web orders" value={String(report.webOrdersCount)} />
            <Metric label="POS orders" value={String(report.posOrdersCount)} />
          </div>

          <div className="sm:grid sm:grid-cols-2 sm:gap-6 sm:items-start">
          <div>
          <div className="text-xs font-medium text-chocolate mb-1.5">Tax breakup</div>
          <div className="card flex flex-col gap-1 mb-4">
            <Row label="Taxable value" value={report.taxBreakup.taxableValue} />
            <Row label="CGST" value={report.taxBreakup.cgst} />
            <Row label="SGST" value={report.taxBreakup.sgst} />
            <div className="flex justify-between text-xs font-medium text-chocolate border-t border-gold/50 pt-1.5 mt-1">
              <span>Total tax collected</span>
              <span>Rs {report.taxBreakup.totalTax.toFixed(2)}</span>
            </div>
          </div>
          </div>

          <div>
          <div className="text-xs font-medium text-chocolate mb-1.5">Top items</div>
          <div className="flex flex-col gap-1.5 mb-4">
            {report.topItems.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="text-[10px] text-espresso w-28 truncate">{item.name}</span>
                <div className="flex-1 h-1.5 bg-vanilla rounded overflow-hidden">
                  <div
                    className="h-full bg-gold"
                    style={{ width: `${Math.max(4, (item.quantity / maxQty) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-mocha w-6 text-right">{item.quantity}</span>
              </div>
            ))}
            {report.topItems.length === 0 && <div className="text-[11px] text-mocha">No sales in this range yet.</div>}
          </div>
          </div>
          </div>

          <button onClick={exportCsv} className="btn-primary w-full sm:w-auto text-xs py-2 px-6">
            Export CSV
          </button>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-vanilla rounded-lg px-2.5 py-2">
      <div className="text-[9px] text-mocha">{label}</div>
      <div className="text-sm font-medium text-chocolate mt-0.5">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-xs text-espresso py-0.5">
      <span>{label}</span>
      <span>Rs {value.toFixed(2)}</span>
    </div>
  );
}
