import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Server Supabase client that reads the session from cookies.
 * Use in Server Components, Server Actions, and Route Handlers.
 *
 * Uses the individual get/set/remove cookie adapter for reliable
 * auth persistence across redirects.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot set cookies; middleware handles refresh.
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server Components cannot set cookies; middleware handles refresh.
        }
      },
    },
  });
}
