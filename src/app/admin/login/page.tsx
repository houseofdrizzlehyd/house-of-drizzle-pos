"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push("/admin/orders");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <div className="text-center mb-6">
          <div className="text-lg font-medium text-chocolate">House of Drizzle</div>
          <div className="text-xs text-mocha mt-1">Admin sign in</div>
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-vanilla rounded-lg px-3 py-2.5 text-sm text-espresso outline-none placeholder:text-mocha"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-vanilla rounded-lg px-3 py-2.5 text-sm text-espresso outline-none placeholder:text-mocha"
          />
          {error && <div className="text-xs text-strawberry">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
