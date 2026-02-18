import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { getStripe } from "@/lib/stripe";
import {
  getSellerIdForOrder,
  getProviderForSeller,
} from "@/lib/payments";
import type { LineItem } from "@/lib/payments";

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  expires_at: string | null;
  stripe_checkout_session_id: string | null;
  payment_provider: string | null;
  payment_session_id: string | null;
  order_items: OrderItemRow[];
};

type OrderItemRow = {
  id: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  listings: { name: string; unit: string | null } | null;
};

export async function POST(req: NextRequest) {
  let body: { orderId?: string; email?: string };
  try {
    body = (await req.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { orderId, email } = body;

  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data, error: fetchError } = await supabase
    .from("orders")
    .select(
      "id, status, total_cents, expires_at, stripe_checkout_session_id, payment_provider, payment_session_id, order_items(id, quantity, unit_price_cents, line_total_cents, listings(name, unit))"
    )
    .eq("id", orderId)
    .single();

  if (fetchError || !data) {
    return NextResponse.json(
      { error: "Order not found." },
      { status: 404 }
    );
  }

  const order = data as unknown as OrderRow;

  if (order.status !== "PENDING_PAYMENT") {
    return NextResponse.json(
      { error: `Order is not awaiting payment (status: ${order.status}).` },
      { status: 409 }
    );
  }

  if (order.expires_at && new Date(order.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This order has expired. Please ask the seller to create a new one." },
      { status: 410 }
    );
  }

  if (!order.order_items || order.order_items.length === 0) {
    return NextResponse.json(
      { error: "Order has no items." },
      { status: 422 }
    );
  }

  // If a checkout session was already created, try to reuse it
  if (order.stripe_checkout_session_id && (!order.payment_provider || order.payment_provider === "stripe" || order.payment_provider === "platform")) {
    try {
      const stripe = getStripe();
      const existingSession = await stripe.checkout.sessions.retrieve(
        order.stripe_checkout_session_id
      );
      if (existingSession.url && existingSession.status === "open") {
        return NextResponse.json({ url: existingSession.url });
      }
    } catch {
      // Session may have expired — fall through and create a new one
    }
  }

  // If a Square payment session already exists, return its URL
  if (order.payment_session_id && order.payment_provider === "square") {
    // Square payment links don't expire the same way, but we create fresh if needed
  }

  // Determine which payment provider to use based on the seller's settings
  const sellerId = await getSellerIdForOrder(orderId);

  if (!sellerId) {
    return NextResponse.json(
      { error: "Could not determine seller for this order." },
      { status: 500 }
    );
  }

  const provider = await getProviderForSeller(sellerId);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const lineItems: LineItem[] = order.order_items.map((item) => ({
    name: item.listings?.name ?? "Market item",
    unitPriceCents: item.unit_price_cents,
    quantity: item.quantity,
  }));

  try {
    const result = await provider.createCheckoutSession({
      orderId,
      totalCents: order.total_cents,
      currency: "aud",
      lineItems,
      successUrl: `${siteUrl}/pay/success?orderId=${orderId}`,
      cancelUrl: `${siteUrl}/pay/${orderId}`,
      email,
      expiresAt: order.expires_at ?? undefined,
    });

    // Save provider info and session ID on the order
    const updatePayload: Record<string, unknown> = {
      payment_provider: provider.providerType === "stripe" ? "stripe" : provider.providerType,
      payment_session_id: result.sessionId,
    };

    // Also store in Stripe-specific column for backwards compatibility
    if (provider.providerType === "stripe") {
      updatePayload.stripe_checkout_session_id = result.sessionId;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to save payment session on order:", updateError.message);
    }

    return NextResponse.json({ url: result.redirectUrl });
  } catch (err: unknown) {
    console.error("Checkout session creation failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
