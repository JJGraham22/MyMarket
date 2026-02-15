import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseClient";

/**
 * POST /api/orders/complete
 *
 * Body: { orderId: string }
 *
 * Checks the order is PAID, then sets status to COMPLETED.
 * Used by the seller after confirming the buyer has collected their items.
 */
export async function POST(req: NextRequest) {
  let body: { orderId?: string };
  try {
    body = (await req.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { orderId } = body;

  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // Load the order to verify current status
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status === "COMPLETED") {
    // Idempotent — already completed
    return NextResponse.json({ status: "COMPLETED" });
  }

  if (order.status !== "PAID") {
    return NextResponse.json(
      { error: `Order must be PAID before completing (current status: ${order.status}).` },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "COMPLETED" })
    .eq("id", orderId);

  if (updateError) {
    console.error(`Failed to complete order ${orderId}:`, updateError.message);
    return NextResponse.json({ error: "Failed to complete order." }, { status: 500 });
  }

  return NextResponse.json({ status: "COMPLETED" });
}
