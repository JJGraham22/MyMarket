import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { getStripe } from "@/lib/stripe";

// ── Types matching the Supabase query shape ────────────────────────────────

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  expires_at: string | null;
  stripe_checkout_session_id: string | null;
  order_items: OrderItemRow[];
};

type OrderItemRow = {
  id: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  listings: { name: string; unit: string | null } | null;
};

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 0. Parse request body
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

  // 1. Load order + order_items (with listing names) via service-role client
  const supabase = createServiceRoleSupabaseClient();

  const { data, error: fetchError } = await supabase
    .from("orders")
    .select(
      "id, status, total_cents, expires_at, stripe_checkout_session_id, order_items(id, quantity, unit_price_cents, line_total_cents, listings(name, unit))"
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

  // 2. Validate order state
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

  // If a Stripe session was already created for this order, return the existing URL
  // so we don't create duplicate sessions.
  if (order.stripe_checkout_session_id) {
    try {
      const stripe = getStripe();
      const existingSession = await stripe.checkout.sessions.retrieve(
        order.stripe_checkout_session_id
      );
      if (existingSession.url && existingSession.status === "open") {
        return NextResponse.json({ url: existingSession.url });
      }
    } catch {
      // Session may have expired or been invalidated — fall through and create a new one.
    }
  }

  // 3. Build Stripe line_items from order_items
  const lineItems = order.order_items.map((item) => ({
    price_data: {
      currency: "aud",
      unit_amount: item.unit_price_cents,
      product_data: {
        name: item.listings?.name ?? "Market item",
      },
    },
    quantity: item.quantity,
  }));

  // 4. Create Stripe Checkout Session
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: { orderId },
      ...(email ? { customer_email: email } : {}),
      success_url: `${siteUrl}/pay/success?orderId=${orderId}`,
      cancel_url: `${siteUrl}/pay/${orderId}`,
      // Give the buyer until the order reservation expires (minimum 30 min for Stripe).
      ...(order.expires_at
        ? { expires_at: Math.max(
            Math.floor(new Date(order.expires_at).getTime() / 1000),
            Math.floor(Date.now() / 1000) + 30 * 60 // Stripe minimum 30 min
          )}
        : {}),
    });

    // 5. Save stripe_checkout_session_id on the order
    const { error: updateError } = await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to save stripe_checkout_session_id:", updateError.message);
      // Non-fatal: the session was created — the buyer can still pay. We'll
      // reconcile via the webhook if needed.
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe checkout session creation failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create Stripe checkout session.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
