import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The QR-ordering pages are designed for a phone screen, so they stay capped
// at a mobile-width column even when opened on a desktop browser. The admin
// dashboard (outside this route group) is not affected by this constraint.
export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  // settings has no anon RLS policy, so this read goes through the service
  // client — safe here since it only decides whether to render a banner.
  const supabase = createServiceClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "accepting_orders").maybeSingle();
  const acceptingOrders = data ? Boolean(data.value) : true;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-cream">
      {!acceptingOrders && (
        <div className="bg-strawberry text-[#FBEAF0] text-center text-[11px] font-medium px-4 py-2">
          We're currently not accepting online orders. Please call us or visit in person.
        </div>
      )}
      {children}
    </div>
  );
}
