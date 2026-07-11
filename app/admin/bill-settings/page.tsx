import { AppShell } from "@/components/app-shell";
import { BillSettingsForm } from "@/components/bill-settings-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  defaultBillSettings,
  type BillSettings,
} from "@/types/bill-settings";

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function BillSettingsPage({
  searchParams,
}: PageProps) {
  const profile = await requireProfile(["admin", "super_admin"]);
  const params = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bill_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const settings: BillSettings = data
    ? ({
        ...defaultBillSettings,
        ...data,
        paper_width: Number(data.paper_width) as 58 | 80,
      } as BillSettings)
    : defaultBillSettings;

  return (
    <AppShell profile={profile}>
      <header className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b48a45]">
          Receipt Configuration
        </p>
        <h2 className="text-3xl font-bold">Bill Settings</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#806b5e]">
          Configure the information and layout printed on customer receipts.
          The preview is optimised for thermal printers.
        </p>
      </header>

      {params.success && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {params.success}
        </div>
      )}

      {(params.error || error) && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {params.error || error?.message}
        </div>
      )}

      <BillSettingsForm initialSettings={settings} />
    </AppShell>
  );
}
