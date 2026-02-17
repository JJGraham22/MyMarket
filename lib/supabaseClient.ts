import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client-side Supabase instance using @supabase/ssr.
 *
 * Stores auth tokens in **cookies** (not localStorage), so the
 * server layout and middleware can read the logged-in user.
 *
 * Only use this from components marked with `"use client"`.
 */
export function createBrowserSupabaseClient() {
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase public URL or anon key is missing in environment variables.");
  }

  return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Server-side Supabase instance (service-role key).
 *
 * For sensitive operations (like calling create_order_with_reservation),
 * configure SUPABASE_SERVICE_ROLE_KEY in your server/runtime environment.
 */
export function createServiceRoleSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase server client requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}

