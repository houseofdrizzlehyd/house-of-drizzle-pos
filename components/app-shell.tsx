import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CreditCard,
  FolderTree,
  TicketPercent,
  ReceiptText,
  Landmark,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import type { Profile } from "@/types/auth";
import { logout } from "@/app/login/actions";

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const canManageMenu =
    profile.role === "admin" || profile.role === "super_admin";
  const isSuperAdmin = profile.role === "super_admin";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-[#eadfcf] bg-[#3b2418] p-4 text-white lg:min-h-screen lg:border-b-0 lg:p-5">
        <div className="mb-6 flex items-center justify-center px-2 py-1">
          <Image
            src="/house-of-drizzle-logo.png"
            alt="House of Drizzle"
            width={220}
            height={132}
            priority
            className="h-auto w-full max-w-[190px] object-contain"
          />
        </div>

        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          <NavLink href="/pos" icon={<CreditCard size={18} />} label="Billing" />
          <NavLink href="/reports" icon={<BarChart3 size={18} />} label="Reports" />

          {canManageMenu && (
            <>
              <NavLink
                href="/admin/categories"
                icon={<FolderTree size={18} />}
                label="Categories"
              />
              <NavLink
                href="/admin/products"
                icon={<Boxes size={18} />}
                label="Products"
              />
              <NavLink
                href="/admin/coupons"
                icon={<TicketPercent size={18} />}
                label="Coupons"
              />
              <NavLink
                href="/admin/bill-settings"
                icon={<ReceiptText size={18} />}
                label="Bill Settings"
              />
              <NavLink
                href="/admin/tax-settings"
                icon={<Landmark size={18} />}
                label="Tax Settings"
              />
            </>
          )}

          {isSuperAdmin && (
            <NavLink
              href="/admin/staff"
              icon={<ShieldCheck size={18} />}
              label="Staff"
            />
          )}
        </nav>

        <div className="mt-5 rounded-2xl bg-white/10 p-3 lg:mt-10">
          <p className="font-semibold">{profile.full_name}</p>
          <p className="mt-1 text-xs capitalize text-white/70">
            {profile.role.replace("_", " ")}
          </p>
          <form action={logout}>
            <button className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#f3d79f]">
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="p-4 lg:p-6">{children}</div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-max items-center gap-2 rounded-xl px-3 py-3 font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
    >
      {icon}
      {label}
    </Link>
  );
}
