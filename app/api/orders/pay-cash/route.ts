import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";

/**
 * POST /api/orders/pay-cash
 *
 * Marks an order as paid with cash payment.
 * Body: { orderId: string, cashReceivedCents: number }
 */
export async function POST(req: NextRequest) {
  let body: { orderId?: string; cashReceivedCents?: number };
  try {
    body = (await req.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { orderId, cashReceivedCents } = body;

  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  if (!cashReceivedCents || typeof cashReceivedCents !== "number" || cashReceivedCents < 0) {
    return NextResponse.json(
      { error: "cashReceivedCents must be a positive number." },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleSupabaseClient();

  // Load the order to verify current status
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, total_cents, expires_at")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status === "PAID" || order.status === "COMPLETED") {
    return NextResponse.json(
      { error: `Order is already ${order.status.toLowerCase()}.` },
      { status: 409 }
    );
  }

  if (order.status !== "PENDING_PAYMENT") {
    return NextResponse.json(
      { error: `Order cannot be paid (current status: ${order.status}).` },
      { status: 409 }
    );
  }

  const now = new Date();
  const expiresAt = order.expires_at ? new Date(order.expires_at) : null;
  if (expiresAt && expiresAt.getTime() < now.getTime()) {
    return NextResponse.json({ error: "This order has expired." }, { status: 410 });
  }

  // Verify cash received is at least the total
  if (cashReceivedCents < order.total_cents) {
    return NextResponse.json(
      {
        error: `Cash received ($${(cashReceivedCents / 100).toFixed(2)}) is less than total ($${(order.total_cents / 100).toFixed(2)}).`,
      },
      { status: 400 }
    );
  }

  // Mark order as paid with cash
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "PAID",
      paid_at: now.toISOString(),
      payment_provider: "cash", // Mark as cash payment
      payment_intent_id: `cash-${orderId}-${Date.now()}`, // Unique identifier for cash payment
    })
    .eq("id", orderId);

  if (updateError) {
    console.error(`Failed to mark order ${orderId} as paid (cash):`, updateError.message);
    return NextResponse.json({ error: "Failed to process cash payment." }, { status: 500 });
  }

  return NextResponse.json({
    status: "PAID",
    paymentMethod: "cash",
    cashReceivedCents,
    changeCents: cashReceivedCents - order.total_cents,
  });
}
