import { createClient } from "@/lib/supabase/server";

// Every admin API route calls this first. Page-level middleware already
// redirects unauthenticated browser navigations to /admin/login, but API
// routes are hit directly by fetch() calls and need their own check.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
