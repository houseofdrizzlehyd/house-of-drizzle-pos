import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { defaultTaxSettings } from "@/types/tax-settings";
import { saveTaxSettings } from "./actions";
export default async function TaxSettingsPage({searchParams}:{searchParams:Promise<{success?:string;error?:string}>}){
 const profile=await requireProfile(["admin","super_admin"]); const params=await searchParams; const supabase=await createClient();
 const {data,error}=await supabase.from("tax_settings").select("*").eq("id",1).maybeSingle(); const x=data?{...defaultTaxSettings,...data,gst_rate:Number(data.gst_rate)}:defaultTaxSettings;
 return <AppShell profile={profile}><header className="mb-5"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b48a45]">GST Configuration</p><h2 className="text-3xl font-bold">Tax Settings</h2></header>
 {params.success&&<div className="mb-5 rounded-2xl bg-green-50 p-4 text-green-800">{params.success}</div>}{(params.error||error)&&<div className="mb-5 rounded-2xl bg-red-50 p-4 text-red-700">{params.error||error?.message}</div>}
 <form action={saveTaxSettings} className="max-w-3xl rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-6 shadow-sm"><div className="grid gap-4 md:grid-cols-2">
 <label className="flex items-center gap-3 rounded-2xl border bg-white p-4"><input type="checkbox" name="gst_enabled" defaultChecked={x.gst_enabled}/>GST enabled</label>
 <label className="flex items-center gap-3 rounded-2xl border bg-white p-4"><input type="checkbox" name="prices_include_tax" defaultChecked={x.prices_include_tax}/>Prices include GST</label>
 <label><span className="mb-2 block text-sm font-semibold">GST rate</span><input name="gst_rate" type="number" step="0.01" defaultValue={x.gst_rate} className="input"/></label>
 <label><span className="mb-2 block text-sm font-semibold">Invoice prefix</span><input name="invoice_prefix" defaultValue={x.invoice_prefix} className="input uppercase"/></label>
 <label><span className="mb-2 block text-sm font-semibold">Business state</span><input name="state_name" defaultValue={x.state_name} className="input"/></label>
 <label><span className="mb-2 block text-sm font-semibold">Place of supply</span><input name="place_of_supply" defaultValue={x.place_of_supply} className="input"/></label>
 </div><div className="mt-5 rounded-2xl bg-[#fff6e5] p-4 text-sm">Default: 5% inclusive GST, split as CGST 2.5% + SGST 2.5%.</div><SubmitButton idleLabel="Save Tax Settings" pendingLabel="Saving..." className="mt-5 w-full rounded-2xl bg-[#3b2418] py-4 font-bold text-white"/></form></AppShell>
}
