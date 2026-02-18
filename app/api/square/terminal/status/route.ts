import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { getSquareClientForSeller } from "@/lib/square";
import { getValidSquareAccessToken } from "@/lib/squareRefresh";

/**
 * GET /api/square/terminal/status?checkoutId=...&orderId=...
 *
 * Polls the status of a terminal checkout to see if payment is complete.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const checkoutId = searchParams.get("checkoutId");
  const orderId = searchParams.get("orderId");

  if (!checkoutId || !orderId) {
    return NextResponse.json(
      { error: "checkoutId and orderId are required." },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data: order } = await supabase
    .from("orders")
    .select("seller_session_id, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status === "PAID" || order.status === "COMPLETED") {
    return NextResponse.json({ status: "COMPLETED", orderStatus: order.status });
  }

  const { data: session } = await supabase
    .from("seller_sessions")
    .select("seller_id")
    .eq("id", order.seller_session_id)
    .single();

  if (!session?.seller_id) {
    return NextResponse.json(
      { error: "Could not determine seller." },
      { status: 500 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, square_access_token, square_refresh_token, square_token_expires_at")
    .eq("id", session.seller_id)
    .single();

  if (!profile?.square_access_token) {
    return NextResponse.json(
      { error: "Seller has no Square account connected." },
      { status: 400 }
    );
  }

  const validToken = await getValidSquareAccessToken(
    profile.square_access_token,
    profile.square_refresh_token,
    profile.square_token_expires_at,
    profile.id
  );
  if (!validToken) {
    return NextResponse.json(
      { error: "Square token expired. Please reconnect Square in payment settings." },
      { status: 400 }
    );
  }

  try {
    const client = getSquareClientForSeller(validToken);
    const response = await client.terminal.checkouts.get({ checkoutId });
    const checkout = response.checkout;

    if (!checkout) {
      return NextResponse.json(
        { error: "Terminal checkout not found." },
        { status: 404 }
      );
    }

    // If the terminal checkout completed, mark the order as paid
    if (checkout.status === "COMPLETED" && order.status === "PENDING_PAYMENT") {
      const paymentId = checkout.paymentIds?.[0] ?? null;

      const updatePayload: Record<string, unknown> = {
        status: "PAID",
        paid_at: new Date().toISOString(),
        payment_provider: "square",
      };

      if (paymentId) {
        updatePayload.square_payment_id = paymentId;
        updatePayload.payment_intent_id = paymentId;
      }

      await supabase.from("orders").update(updatePayload).eq("id", orderId);
    }

    return NextResponse.json({
      status: checkout.status,
      orderStatus:
        checkout.status === "COMPLETED" ? "PAID" : order.status,
    });
  } catch (err: unknown) {
    console.error("Failed to get terminal checkout status:", err);
    const message =
      err instanceof Error ? err.message : "Failed to check terminal status.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
