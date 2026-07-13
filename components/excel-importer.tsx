"use client";

import { useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { importProducts } from "@/app/admin/import/actions";
import type { ImportResult, ImportRow } from "@/types/import";

type RawRow = Record<string, unknown>;

function normalizeBoolean(value: unknown, defaultValue: boolean) {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  if (["yes", "y", "true", "1", "active"].includes(text)) return true;
  if (["no", "n", "false", "0", "inactive"].includes(text)) return false;
  return defaultValue;
}

function pick(row: RawRow, names: string[]) {
  const entry = Object.entries(row).find(([key]) =>
    names.includes(key.trim().toLowerCase())
  );
  return entry?.[1];
}

export function ExcelImporter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult>({ status: "idle", message: "" });
  const [isPending, startTransition] = useTransition();

  async function handleFile(file?: File) {
    if (!file) return;
    setResult({ status: "idle", message: "" });
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<RawRow>(firstSheet, { defval: "" });
      const parsed: ImportRow[] = [];
      const validationErrors: string[] = [];
      const seen = new Set<string>();

      data.forEach((row, index) => {
        const rowNumber = index + 2;
        const category = String(pick(row, ["category", "category name"]) ?? "").trim();
        const productName = String(pick(row, ["product name", "product", "name"]) ?? "").trim();
        const price = Number(pick(row, ["price", "selling price"]));
        const isTopping = normalizeBoolean(pick(row, ["is topping", "topping"]), false);
        const active = normalizeBoolean(pick(row, ["active", "is active"]), true);

        if (!category || !productName || !Number.isFinite(price) || price < 0) {
          validationErrors.push(`Row ${rowNumber}: category, product name and a valid price are required.`);
          return;
        }

        const duplicateKey = `${category.toLowerCase()}:${productName.toLowerCase()}`;
        if (seen.has(duplicateKey)) {
          validationErrors.push(`Row ${rowNumber}: duplicate product \"${productName}\" in ${category}.`);
          return;
        }
        seen.add(duplicateKey);

        parsed.push({ rowNumber, category, productName, price, isTopping, active });
      });

      setRows(parsed);
      setErrors(validationErrors);
    } catch {
      setRows([]);
      setErrors(["The selected file could not be read. Use the provided .xlsx template."]);
    }
  }

  function runImport() {
    startTransition(async () => {
      const response = await importProducts(rows);
      setResult(response);
      if (response.status === "success") {
        setRows([]);
        setErrors([]);
        setFileName("");
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold">Upload menu Excel</h3>
            <p className="mt-1 text-sm text-[#806b5e]">
              Categories are created automatically. Existing products with the same name and category are updated.
            </p>
          </div>
          <a
            href="/product-import-template.xlsx"
            download
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#3b2418] px-4 py-3 text-sm font-bold"
          >
            <Download size={18} />
            Download Template
          </a>
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#d9c8b3] bg-white p-10 text-center transition hover:border-[#b48a45]">
          <FileSpreadsheet size={38} className="text-[#9b6f31]" />
          <span className="mt-3 font-bold">Choose an Excel file</span>
          <span className="mt-1 text-sm text-[#806b5e]">.xlsx or .xls</span>
          {fileName && <span className="mt-3 rounded-full bg-[#fff3dc] px-3 py-1 text-sm font-semibold">{fileName}</span>}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
      </section>

      {result.message && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${result.status === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"}`}>
          <div className="flex items-center gap-2">
            {result.status === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {result.message}
          </div>
          {result.status === "success" && (
            <p className="mt-2 pl-6">
              Categories created: {result.categoriesCreated ?? 0} · Products created: {result.productsCreated ?? 0} · Products updated: {result.productsUpdated ?? 0}
            </p>
          )}
        </div>
      )}

      {(rows.length > 0 || errors.length > 0) && (
        <section className="rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold">Import Preview</h3>
              <p className="text-sm text-[#806b5e]">{rows.length} valid rows · {errors.length} errors</p>
            </div>
            <button
              type="button"
              onClick={runImport}
              disabled={rows.length === 0 || errors.length > 0 || isPending}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#3b2418] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? <LoaderCircle size={18} className="animate-spin" /> : <Upload size={18} />}
              {isPending ? "Importing..." : "Import Products"}
            </button>
          </div>

          {errors.length > 0 && (
            <div className="mt-4 max-h-44 overflow-y-auto rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errors.map((error) => <p key={error} className="mb-1">• {error}</p>)}
            </div>
          )}

          {rows.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-[#eadfcf]">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#fff4df]">
                  <tr>
                    <th className="px-4 py-3">Row</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3">Topping</th>
                    <th className="px-4 py-3">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((row) => (
                    <tr key={`${row.rowNumber}-${row.productName}`} className="border-t border-[#eadfcf]">
                      <td className="px-4 py-3">{row.rowNumber}</td>
                      <td className="px-4 py-3">{row.category}</td>
                      <td className="px-4 py-3 font-semibold">{row.productName}</td>
                      <td className="px-4 py-3 text-right">₹{row.price.toFixed(2)}</td>
                      <td className="px-4 py-3">{row.isTopping ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">{row.active ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 200 && <p className="border-t p-3 text-center text-xs text-[#806b5e]">Showing the first 200 rows.</p>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
