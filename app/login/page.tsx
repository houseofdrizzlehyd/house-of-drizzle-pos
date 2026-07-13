import Image from "next/image";
import { LockKeyhole, UserRound } from "lucide-react";
import { login } from "./actions";
import { SubmitButton } from "@/components/submit-button";

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
    <main className="relative min-h-screen overflow-hidden bg-[#f2ddbd]">
      <Image
        src="/pos-login-background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top"
      />

      <div className="absolute inset-0 bg-[#f2ddbd]/5" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center text-[#351a12]">
            <div className="mx-auto mb-4 w-fit">
              <Image
                src="/house-of-drizzle-logo.png"
                alt="House of Drizzle"
                width={300}
                height={180}
                priority
                className="h-auto w-[230px] object-contain sm:w-[270px]"
              />
            </div>

            <div className="flex items-center justify-center gap-4">
              <span className="h-px w-16 bg-[#351a12]/40" />
              <h1 className="text-2xl font-medium tracking-wide sm:text-3xl">
                POS LOGIN
              </h1>
              <span className="h-px w-16 bg-[#351a12]/40" />
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-red-300 bg-red-50/95 px-4 py-3 text-center text-sm font-medium text-red-700 shadow-sm">
              {errorMessage}
            </div>
          )}

          <form action={login} className="space-y-5">
            <label className="flex items-center gap-3 rounded-[1.4rem] border-2 border-[#43251d] bg-[#f8ead4]/92 px-5 shadow-[0_7px_14px_rgba(55,30,21,0.16)] transition focus-within:-translate-y-0.5 focus-within:shadow-[0_10px_18px_rgba(55,30,21,0.2)]">
              <UserRound size={23} strokeWidth={1.8} className="shrink-0 text-[#5f382d]" />
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Username or email"
                className="w-full bg-transparent py-4 text-base text-[#351a12] outline-none placeholder:text-[#7b655e] sm:text-lg"
              />
            </label>

            <label className="flex items-center gap-3 rounded-[1.4rem] border-2 border-[#43251d] bg-[#f8ead4]/92 px-5 shadow-[0_7px_14px_rgba(55,30,21,0.16)] transition focus-within:-translate-y-0.5 focus-within:shadow-[0_10px_18px_rgba(55,30,21,0.2)]">
              <LockKeyhole size={23} strokeWidth={1.8} className="shrink-0 text-[#5f382d]" />
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Password"
                className="w-full bg-transparent py-4 text-base text-[#351a12] outline-none placeholder:text-[#7b655e] sm:text-lg"
              />
            </label>

            <SubmitButton
              idleLabel="Login"
              pendingLabel="Signing in..."
              className="w-full rounded-[1.4rem] bg-[#43251d] py-4 text-lg font-bold text-white shadow-[0_8px_16px_rgba(55,30,21,0.24)] transition hover:-translate-y-0.5 hover:bg-[#351a12] active:translate-y-0"
            />
          </form>
        </div>
      </section>
    </main>
  );
}
