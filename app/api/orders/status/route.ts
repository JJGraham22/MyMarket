import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { confirmSquarePaymentIfPaid } from "@/lib/squareConfirmPayment";

/**
 * GET /api/orders/status?orderId=<uuid>
 *
 * Returns { status, totalCents, paidAt } for a given order.
 * Used by client components to poll for status changes.
 * For Square orders still PENDING_PAYMENT, re-checks Square and may mark PAID.
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total_cents, paid_at, payment_provider, payment_session_id")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // If Square and still pending, try to confirm with Square (webhook may not have run yet)
  if (
    data.status === "PENDING_PAYMENT" &&
    data.payment_provider === "square" &&
    data.payment_session_id
  ) {
    await confirmSquarePaymentIfPaid(orderId);
    const { data: refreshed } = await supabase
      .from("orders")
      .select("id, status, total_cents, paid_at")
      .eq("id", orderId)
      .single();
    if (refreshed) {
      return NextResponse.json({
        status: refreshed.status,
        totalCents: refreshed.total_cents,
        paidAt: refreshed.paid_at,
      });
    }
  }

  return NextResponse.json({
    status: data.status,
    totalCents: data.total_cents,
    paidAt: data.paid_at,
  });
}
