"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
function go(message:string,type:"success"|"error"){redirect(`/admin/tax-settings?${type}=${encodeURIComponent(message)}`)}
export async function saveTaxSettings(formData:FormData){
 const profile=await requireProfile(["admin","super_admin"]);
 const gstRate=Number(formData.get("gst_rate")); const prefix=String(formData.get("invoice_prefix")??"").trim().toUpperCase();
 const state=String(formData.get("state_name")??"").trim(); const place=String(formData.get("place_of_supply")??"").trim();
 if(!Number.isFinite(gstRate)||gstRate<0||gstRate>100) go("Enter a valid GST rate.","error");
 if(!prefix||!/^[A-Z0-9-]+$/.test(prefix)) go("Invalid invoice prefix.","error");
 const supabase=await createClient(); const {error}=await supabase.from("tax_settings").upsert({id:1,gst_enabled:formData.get("gst_enabled")==="on",gst_rate:gstRate,prices_include_tax:formData.get("prices_include_tax")==="on",invoice_prefix:prefix,state_name:state,place_of_supply:place,updated_by:profile.id,updated_at:new Date().toISOString()},{onConflict:"id"});
 if(error) go(error.message,"error"); revalidatePath("/pos"); revalidatePath("/reports"); go("Tax settings saved successfully.","success");
}
