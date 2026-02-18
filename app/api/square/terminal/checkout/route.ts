import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { getSquareClientForSeller } from "@/lib/square";
import { getValidSquareAccessToken } from "@/lib/squareRefresh";
import { randomUUID } from "crypto";

/**
 * POST /api/square/terminal/checkout
 *
 * Creates a Terminal checkout request that is sent to the seller's paired
 * Square Terminal device. The buyer can then tap/insert their card on the device.
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
    return NextResponse.json(
      { error: "orderId is required." },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, total_cents, expires_at, seller_session_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status !== "PENDING_PAYMENT") {
    return NextResponse.json(
      { error: `Order is not awaiting payment (status: ${order.status}).` },
      { status: 409 }
    );
  }

  if (order.expires_at && new Date(order.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This order has expired." },
      { status: 410 }
    );
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
    .select("id, square_access_token, square_refresh_token, square_token_expires_at, square_device_id, square_location_id")
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
      { error: "Square token expired. Seller should reconnect Square in payment settings." },
      { status: 400 }
    );
  }

  if (!profile.square_device_id) {
    return NextResponse.json(
      { error: "Seller has no Square Terminal paired. Pair a terminal in Settings > Payments." },
      { status: 400 }
    );
  }

  try {
    const client = getSquareClientForSeller(validToken);

    const response = await client.terminal.checkouts.create({
      idempotencyKey: randomUUID(),
      checkout: {
        amountMoney: {
          amount: BigInt(order.total_cents),
          currency: "AUD",
        },
        deviceOptions: {
          deviceId: profile.square_device_id,
          skipReceiptScreen: false,
          tipSettings: {
            allowTipping: false,
          },
        },
        referenceId: orderId,
        note: `MyMarket order ${orderId.slice(0, 8)}`,
        paymentType: "CARD_PRESENT",
      },
    });

    const terminalCheckout = response.checkout;

    if (!terminalCheckout?.id) {
      throw new Error("Square did not return a terminal checkout.");
    }

    // Store the terminal checkout ID on the order
    await supabase
      .from("orders")
      .update({
        payment_provider: "square",
        payment_session_id: terminalCheckout.id,
      })
      .eq("id", orderId);

    return NextResponse.json({
      checkoutId: terminalCheckout.id,
      status: terminalCheckout.status,
    });
  } catch (err: unknown) {
    console.error("Failed to create terminal checkout:", err);
    const message =
      err instanceof Error ? err.message : "Failed to send payment to terminal.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
