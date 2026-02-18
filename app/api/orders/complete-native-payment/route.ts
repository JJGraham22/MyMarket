import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";

/**
 * POST /api/orders/complete-native-payment
 *
 * Called by the native app after a successful Square Mobile Payments SDK
 * transaction (Reader or Tap to Pay on iPhone). Marks the order as PAID
 * with the Square payment ID from the on-device transaction.
 */
export async function POST(req: NextRequest) {
  let body: { orderId?: string; squarePaymentId?: string };
  try {
    body = (await req.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { orderId, squarePaymentId } = body;

  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json(
      { error: "orderId is required." },
      { status: 400 }
    );
  }

  if (!squarePaymentId || typeof squarePaymentId !== "string") {
    return NextResponse.json(
      { error: "squarePaymentId is required." },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleSupabaseClient();

  // Load the order
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Idempotent: if already paid or completed, just return success
  if (order.status === "PAID" || order.status === "COMPLETED") {
    return NextResponse.json({ status: order.status });
  }

  if (order.status !== "PENDING_PAYMENT") {
    return NextResponse.json(
      {
        error: `Order is not awaiting payment (status: ${order.status}).`,
      },
      { status: 409 }
    );
  }

  // Mark as paid
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "PAID",
      paid_at: new Date().toISOString(),
      payment_provider: "square",
      square_payment_id: squarePaymentId,
      payment_intent_id: squarePaymentId,
    })
    .eq("id", orderId);

  if (updateError) {
    console.error(
      `Failed to mark order ${orderId} as PAID:`,
      updateError.message
    );
    return NextResponse.json(
      { error: "Failed to update order." },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "PAID" });
}
