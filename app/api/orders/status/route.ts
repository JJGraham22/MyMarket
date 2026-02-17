import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";

/**
 * GET /api/orders/status?orderId=<uuid>
 *
 * Returns { status, totalCents, paidAt } for a given order.
 * Used by client components to poll for status changes.
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total_cents, paid_at")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    status: data.status,
    totalCents: data.total_cents,
    paidAt: data.paid_at,
  });
}
