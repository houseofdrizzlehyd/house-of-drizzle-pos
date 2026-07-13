"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  FolderTree,
  Landmark,
  LoaderCircle,
  LogOut,
  Menu,
  ReceiptText,
  ShieldCheck,
  TicketPercent,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type { Profile } from "@/types/auth";
import { logout } from "@/app/login/actions";
import { SubmitButton } from "@/components/submit-button";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const canManageMenu =
    profile.role === "admin" || profile.role === "super_admin";
  const isSuperAdmin = profile.role === "super_admin";

  useEffect(() => {
    setCollapsed(localStorage.getItem("hod-sidebar-collapsed") === "true");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("hod-sidebar-collapsed", String(next));
      return next;
    });
  }

  function navigate(href: string) {
    if (href === pathname) return;
    startTransition(() => router.push(href));
  }

  const navItems: NavItem[] = [
    { href: "/pos", label: "Billing", icon: <CreditCard size={20} /> },
    { href: "/reports", label: "Reports", icon: <BarChart3 size={20} /> },
  ];

  if (canManageMenu) {
    navItems.push(
      { href: "/admin/categories", label: "Categories", icon: <FolderTree size={20} /> },
      { href: "/admin/products", label: "Products", icon: <Boxes size={20} /> },
      { href: "/admin/import", label: "Excel Import", icon: <FileSpreadsheet size={20} /> },
      { href: "/admin/coupons", label: "Coupons", icon: <TicketPercent size={20} /> },
      { href: "/admin/bill-settings", label: "Bill Settings", icon: <ReceiptText size={20} /> },
      { href: "/admin/tax-settings", label: "Tax Settings", icon: <Landmark size={20} /> },
    );
  }

  if (isSuperAdmin) {
    navItems.push({ href: "/admin/staff", label: "Staff", icon: <ShieldCheck size={20} /> });
  }

  function renderSidebar(compact: boolean) {
    return (
    <>
      <div className={`mb-5 flex items-center ${compact ? "justify-center" : "justify-between"}`}>
        <div className={`flex items-center justify-center ${compact ? "w-11" : "flex-1"}`}>
          <Image
            src="/house-of-drizzle-logo.png"
            alt="House of Drizzle"
            width={220}
            height={132}
            priority
            className={`h-auto object-contain transition-all ${compact ? "w-10" : "w-full max-w-[180px]"}`}
          />
        </div>
        {!compact && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden rounded-xl p-2 text-white/75 transition hover:bg-white/10 hover:text-white lg:block"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {compact && (
        <button
          type="button"
          onClick={toggleCollapsed}
          className="mx-auto mb-4 hidden rounded-xl p-2 text-white/75 transition hover:bg-white/10 hover:text-white lg:block"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={20} />
        </button>
      )}

      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => navigate(item.href)}
              title={compact ? item.label : undefined}
              disabled={isPending}
              className={`flex w-full items-center rounded-xl py-3 font-semibold transition disabled:cursor-wait ${
                compact ? "justify-center px-2" : "gap-3 px-3"
              } ${
                active
                  ? "bg-white text-[#3b2418]"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!compact && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={`mt-8 rounded-2xl bg-white/10 ${compact ? "p-2" : "p-3"}`}>
        {!compact && (
          <>
            <p className="font-semibold">{profile.full_name}</p>
            <p className="mt-1 text-xs capitalize text-white/70">
              {profile.role.replace("_", " ")}
            </p>
          </>
        )}
        <form action={logout}>
          <SubmitButton
            idleLabel={compact ? "" : "Sign out"}
            pendingLabel={compact ? "" : "Signing out..."}
            icon={<LogOut size={17} />}
            className={`mt-2 text-sm font-semibold text-[#f3d79f] ${
              compact ? "w-full rounded-xl py-2" : "justify-start"
            }`}
          />
        </form>
      </div>
    </>
    );
  }

  return (
    <div
      className="min-h-screen lg:grid"
      style={{ gridTemplateColumns: collapsed ? "82px minmax(0, 1fr)" : "250px minmax(0, 1fr)" }}
    >
      {isPending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 font-semibold text-[#3b2418] shadow-xl">
            <LoaderCircle className="animate-spin" size={22} />
            Loading...
          </div>
        </div>
      )}

      <aside className={`hidden bg-[#3b2418] p-4 text-white transition-all lg:block lg:min-h-screen ${collapsed ? "w-[82px]" : "w-[250px]"}`}>
        {renderSidebar(collapsed)}
      </aside>

      <div className="lg:hidden">
        <header className="flex items-center justify-between bg-[#3b2418] px-4 py-3 text-white">
          <Image
            src="/house-of-drizzle-logo.png"
            alt="House of Drizzle"
            width={150}
            height={90}
            className="h-12 w-auto object-contain"
          />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 hover:bg-white/10"
            aria-label="Open menu"
          >
            <Menu size={25} />
          </button>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-black/45" onClick={() => setMobileOpen(false)}>
            <aside
              className="h-full w-[285px] overflow-y-auto bg-[#3b2418] p-4 text-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl p-2 hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X size={23} />
                </button>
              </div>
              {renderSidebar(false)}
            </aside>
          </div>
        )}
      </div>

      <main className="min-w-0 p-4 lg:p-6">{children}</main>
    </div>
  );
}
