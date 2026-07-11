import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStaff, resetStaffPassword, toggleStaffStatus, updateStaffRole } from "./actions";

type StaffPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const profile = await requireProfile(["super_admin"]);
  const params = await searchParams;
  const admin = createAdminClient();
  const { data: staff, error } = await admin
    .from("profiles")
    .select("id, full_name, role, is_active, created_at")
    .order("created_at");

  return (
    <AppShell profile={profile}>
      <header className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b48a45]">Super Admin</p>
        <h2 className="text-3xl font-bold">Staff Accounts</h2>
        <p className="mt-2 text-sm text-[#806b5e]">Create and manage biller, admin and super-admin accounts.</p>
      </header>

      {params.success && <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{params.success}</div>}
      {params.error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{params.error}</div>}

      <section className="grid gap-5 2xl:grid-cols-[390px_1fr]">
        <form action={createStaff} className="h-fit rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5">
          <h3 className="text-lg font-bold">Create staff account</h3>
          <label className="mt-4 block text-sm font-semibold">Full name</label>
          <input name="full_name" required autoComplete="off" placeholder="Staff member name" className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]" />
          <label className="mt-4 block text-sm font-semibold">Email address</label>
          <input name="email" type="email" required autoComplete="off" placeholder="staff@houseofdrizzle.com" className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]" />
          <label className="mt-4 block text-sm font-semibold">Temporary password</label>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Minimum 8 characters" className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]" />
          <label className="mt-4 block text-sm font-semibold">Role</label>
          <select name="role" required defaultValue="biller" className="mt-2 w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]">
            <option value="biller">Biller</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <SubmitButton idleLabel="Create Staff Account" pendingLabel="Creating Account..." className="mt-4 w-full rounded-2xl bg-[#3b2418] py-3 font-bold text-white" />
        </form>

        <div className="space-y-4">
          {error && <p className="rounded-2xl bg-red-50 p-4 text-red-700">{error.message}</p>}
          {staff?.map((member) => (
            <article key={member.id} className="rounded-3xl border border-[#eadfcf] bg-[#fffdf8] p-5">
              <div className="flex flex-col gap-3 border-b border-[#eadfcf] pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-bold">{member.full_name}</p>
                  <p className="mt-1 text-sm capitalize text-[#806b5e]">{member.role.replace("_", " ")}</p>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${member.is_active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>{member.is_active ? "Active" : "Inactive"}</span>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <form action={updateStaffRole}>
                  <input type="hidden" name="id" value={member.id} />
                  <label className="block text-xs font-bold uppercase tracking-wide text-[#806b5e]">Change role</label>
                  <div className="mt-2 flex gap-2">
                    <select name="role" defaultValue={member.role} className="min-w-0 flex-1 rounded-xl border border-[#d9c8b3] bg-white px-3 py-2">
                      <option value="biller">Biller</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <SubmitButton idleLabel="Save" pendingLabel="Saving..." className="rounded-xl border border-[#3b2418] px-4 py-2 text-sm font-bold" />
                  </div>
                </form>

                <form action={toggleStaffStatus}>
                  <input type="hidden" name="id" value={member.id} />
                  <input type="hidden" name="is_active" value={String(member.is_active)} />
                  <label className="block text-xs font-bold uppercase tracking-wide text-[#806b5e]">Account status</label>
                  <SubmitButton idleLabel={member.is_active ? "Deactivate" : "Activate"} pendingLabel="Updating..." className="mt-2 w-full rounded-xl border border-[#d9c8b3] bg-white px-4 py-2 text-sm font-bold" />
                </form>

                <form action={resetStaffPassword}>
                  <input type="hidden" name="id" value={member.id} />
                  <label className="block text-xs font-bold uppercase tracking-wide text-[#806b5e]">Reset password</label>
                  <div className="mt-2 flex gap-2">
                    <input name="password" type="password" minLength={8} required placeholder="New password" className="min-w-0 flex-1 rounded-xl border border-[#d9c8b3] bg-white px-3 py-2" />
                    <SubmitButton idleLabel="Reset" pendingLabel="Resetting..." className="rounded-xl border border-[#3b2418] px-4 py-2 text-sm font-bold" />
                  </div>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
