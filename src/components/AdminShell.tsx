"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/pos", label: "POS" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reports", label: "Reports" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <div className="sm:w-48 bg-chocolate flex sm:flex-col items-center sm:items-stretch justify-between sm:justify-start gap-1 sm:gap-1.5 px-2 py-2 sm:py-4 flex-shrink-0">
        <div className="hidden sm:block text-cream text-sm font-medium px-2 pb-3">House of Drizzle</div>
        <div className="flex sm:flex-col gap-1 sm:gap-1.5 flex-1 sm:flex-none">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs sm:text-sm text-center sm:text-left px-2.5 py-2 rounded-md flex-1 sm:flex-none ${
                  active ? "bg-mocha text-cream font-medium" : "text-gold"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <button onClick={signOut} className="text-xs sm:text-sm text-gold px-2.5 py-2 sm:mt-auto">
          Sign out
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto w-full">{children}</div>
      </div>
    </div>
  );
}
