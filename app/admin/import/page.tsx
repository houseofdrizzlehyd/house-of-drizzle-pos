import { AppShell } from "@/components/app-shell";
import { ExcelImporter } from "@/components/excel-importer";
import { requireProfile } from "@/lib/auth";

export default async function ImportPage() {
  const profile = await requireProfile(["admin", "super_admin"]);

  return (
    <AppShell profile={profile}>
      <header className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b48a45]">
          Menu Management
        </p>
        <h2 className="text-3xl font-bold">Excel Import</h2>
        <p className="mt-2 text-sm text-[#806b5e]">
          Bulk-create categories and create or update products from Excel.
        </p>
      </header>
      <ExcelImporter />
    </AppShell>
  );
}
