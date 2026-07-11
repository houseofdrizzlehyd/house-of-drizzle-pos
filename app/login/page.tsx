import { Droplets } from "lucide-react";
import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  "missing-fields": "Enter both your email address and password.",
  "invalid-login": "The email address or password is incorrect.",
  inactive: "This staff account is inactive. Contact the super admin.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <section className="w-full max-w-md rounded-[2rem] border border-[#eadfcf] bg-[#fffdf8] p-8 shadow-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-[#3b2418] p-3 text-white">
            <Droplets size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b48a45]">
              House of Drizzle
            </p>
            <h1 className="text-2xl font-bold">Staff Login</h1>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form action={login} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Email address</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]"
              placeholder="staff@houseofdrizzle.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-2xl border border-[#d9c8b3] bg-white px-4 py-3 outline-none focus:border-[#3b2418]"
              placeholder="Enter password"
            />
          </label>

          <button className="w-full rounded-2xl bg-[#3b2418] py-4 font-bold text-white transition hover:opacity-90">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
