import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseClient";

/**
 * POST /api/orders/release-expired
 *
 * Protected by CRON_SECRET token (passed as Authorization: Bearer <token>).
 *
 * Calls the release_expired_orders() Postgres function which, in a single
 * transaction, finds orders with status='PENDING_PAYMENT' and
 * expires_at < now(), moves reserved inventory back to available, and
 * sets their status to 'EXPIRED'.
 *
 * Designed to be called by a cron job (e.g. Vercel Cron, external scheduler).
 */
export async function POST(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  // ── Release expired orders via transactional RPC ───────────────────────

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.rpc("release_expired_orders");

  if (error) {
    console.error("release_expired_orders RPC failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const released = typeof data === "number" ? data : 0;

  return NextResponse.json({ released });
}
