import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, stripeWebhookSecret } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabaseClient";

// Next.js App Router: disable body parsing so we get the raw body for
// Stripe signature verification.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // ── 1. Read raw body + verify signature ──────────────────────────────────

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  if (!stripeWebhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set — cannot verify webhook.");
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Signature verification failed.";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── 2. Handle events ────────────────────────────────────────────────────

  const supabase = createServerSupabaseClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(supabase, session);
      break;
    }

    case "payment_intent.succeeded": {
      // Optional backup: if the checkout.session.completed event is missed
      // or delayed, we can also mark the order as paid via the PaymentIntent.
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentSucceeded(supabase, paymentIntent);
      break;
    }

    default:
      // Unhandled event type — acknowledge receipt.
      break;
  }

  // Always return 200 quickly so Stripe doesn't retry.
  return NextResponse.json({ received: true });
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleCheckoutSessionCompleted(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  session: Stripe.Checkout.Session
) {
  const orderId =
    session.metadata?.orderId ?? null;

  if (!orderId) {
    // Try to find the order by stripe_checkout_session_id
    const { data } = await supabase
      .from("orders")
      .select("id, status")
      .eq("stripe_checkout_session_id", session.id)
      .single();

    if (!data) {
      console.error(
        `Webhook checkout.session.completed: no orderId in metadata and no order found for session ${session.id}`
      );
      return;
    }

    await markOrderPaid(supabase, data.id, data.status, session.payment_intent as string | null);
    return;
  }

  // Load order to check current status (idempotency)
  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    console.error(`Webhook checkout.session.completed: order ${orderId} not found in DB.`);
    return;
  }

  await markOrderPaid(supabase, order.id, order.status, session.payment_intent as string | null);
}

async function handlePaymentIntentSucceeded(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  const orderId = paymentIntent.metadata?.orderId ?? null;

  if (!orderId) {
    // We can't correlate this PaymentIntent to an order without metadata.
    return;
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    console.error(`Webhook payment_intent.succeeded: order ${orderId} not found in DB.`);
    return;
  }

  await markOrderPaid(supabase, order.id, order.status, paymentIntent.id);
}

// ── Shared helper ────────────────────────────────────────────────────────────

async function markOrderPaid(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  orderId: string,
  currentStatus: string,
  stripePaymentIntentId: string | null
) {
  // Idempotent: if already PAID or COMPLETED, do nothing.
  if (currentStatus === "PAID" || currentStatus === "COMPLETED") {
    return;
  }

  const updatePayload: Record<string, unknown> = {
    status: "PAID",
    paid_at: new Date().toISOString(),
  };

  if (stripePaymentIntentId) {
    updatePayload.stripe_payment_intent_id = stripePaymentIntentId;
  }

  const { error } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);

  if (error) {
    console.error(`Failed to mark order ${orderId} as PAID:`, error.message);
  }
}
