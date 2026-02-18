import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { squareWebhookSignatureKey, getSquareClient, getSquareClientForSeller } from "@/lib/square";
import { getValidSquareAccessToken } from "@/lib/squareRefresh";
import { getSellerIdForOrder, getSellerPaymentConfig } from "@/lib/payments";
import { createHmac } from "crypto";

export const runtime = "nodejs";

/**
 * Verify Square webhook signature.
 * Square signs webhooks using HMAC-SHA256 with the notification URL and body.
 */
function verifySquareWebhook(
  body: string,
  signature: string | null,
  notificationUrl: string
): boolean {
  if (!signature || !squareWebhookSignatureKey) return false;

  const hmac = createHmac("sha256", squareWebhookSignatureKey);
  hmac.update(notificationUrl + body);
  const expectedSignature = hmac.digest("base64");

  return signature === expectedSignature;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");

  // Square signs with the exact URL you register. When behind ngrok/proxy, req.url may
  // not match; set SQUARE_WEBHOOK_NOTIFICATION_URL to the full URL (e.g. https://xxx.ngrok-free.app/api/square/webhook).
  const notificationUrl =
    process.env.SQUARE_WEBHOOK_NOTIFICATION_URL?.trim() || req.url;

  if (!squareWebhookSignatureKey) {
    console.error("SQUARE_WEBHOOK_SIGNATURE_KEY is not set — cannot verify webhook.");
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  if (!verifySquareWebhook(body, signature, notificationUrl)) {
    console.error("Square webhook signature verification failed.");
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  let event: {
    type: string;
    event_id?: string;
    id?: string;
    data?: {
      type?: string;
      id?: string;
      object?: Record<string, unknown>;
    };
  };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  // Idempotency: use event_id (or id) so we only process each event once (Square may send duplicates)
  const eventId = event.event_id ?? event.id;
  if (eventId) {
    const { error: insertError } = await supabase
      .from("square_webhook_events")
      .insert({ event_id: eventId });
    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ received: true, duplicate: true });
      }
      // Table missing or other error — continue processing so we don't drop events
      if (insertError.code !== "42P01") {
        console.error("Square webhook idempotency insert error:", insertError.message);
      }
    }
  }

  // Events we don't need to process: return 200 immediately to avoid Square retries
  const unhandledTypes = ["order.updated", "order.created", "inventory.updated", "customer.created"];
  if (unhandledTypes.includes(event.type)) {
    return NextResponse.json({ received: true });
  }

  // Extract payment from event.data (Square may send object or object.payment)
  const dataObj = event.data?.object as Record<string, unknown> | undefined;
  const paymentPayload =
    dataObj && typeof (dataObj as any).payment === "object"
      ? ((dataObj as any).payment as Record<string, unknown>)
      : dataObj ?? {};

  // Normalize status (may be top-level or nested)
  const paymentStatus =
    (paymentPayload.status as string) ??
    (paymentPayload as any).payment?.status ??
    (dataObj as any)?.status;

  // Square retries if we don't return 200 within ~5–10s. Process payment/terminal
  // in the background so we respond immediately and stop the retry loop.
  switch (event.type) {
    case "payment.completed": {
      void handlePaymentCompleted(supabase, paymentPayload);
      break;
    }

    case "payment.created":
    case "payment.updated": {
      if (paymentStatus === "COMPLETED") {
        void handlePaymentCompleted(supabase, paymentPayload);
      }
      break;
    }

    case "terminal.checkout.updated": {
      void handleTerminalCheckoutUpdated(supabase, event.data?.object ?? {});
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentCompleted(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  payment: Record<string, unknown>
) {
  const paymentId = payment.id as string | undefined;
  const squareOrderId = payment.order_id as string | undefined;
  
  // Log payment details for debugging
  console.log("Square webhook payment.completed:", {
    paymentId,
    squareOrderId,
    reference_id: payment.reference_id,
    note: payment.note,
    source_type: payment.source_type,
    payment_keys: Object.keys(payment),
  });
  
  // For Terminal payments, orderId is in reference_id or note
  let orderId = (payment.reference_id as string) ??
    ((payment.note as string)?.match(/orderId:(\S+)/)?.[1]) ?? null;

  // Try to find the order first by square_payment_id (if we already stored it)
  let order: { id: string; status: string; seller_session_id: string | null } | null = null;

  if (paymentId) {
    const { data } = await supabase
      .from("orders")
      .select("id, status, seller_session_id")
      .eq("square_payment_id", paymentId)
      .single();
    order = data;
    if (order) {
      console.log(`Square webhook: found order ${order.id} by square_payment_id`);
    }
  }

  // For Payment Links, orderId is stored in Square order metadata
  // Fetch the Square order if we have a squareOrderId but no orderId yet
  if (squareOrderId && !orderId && !order) {
    // Try platform account first
    try {
      const client = getSquareClient();
      const orderResponse = await client.orders.get({
        orderId: squareOrderId,
      });
      const squareOrder = (orderResponse as { order?: { metadata?: Record<string, string> } }).order;
      if (squareOrder?.metadata) {
        // Extract our orderId from Square order metadata
        const metadataOrderId = squareOrder.metadata.orderId as string | undefined;
        if (metadataOrderId) {
          orderId = metadataOrderId;
          console.log(
            `Square webhook: extracted orderId ${orderId} from Square order ${squareOrderId} metadata (platform account)`
          );
        }
      }
    } catch (err) {
      // If platform account fails, try to find order by payment_session_id
      // and then try seller account
      console.log(
        `Square webhook: platform account fetch failed for order ${squareOrderId}, trying seller accounts...`
      );
      
      // Try to find order by payment_session_id (Payment Link ID)
      // Check various possible fields where Square might store the Payment Link ID
      const possiblePaymentLinkIds = [
        payment.source_id,
        payment.payment_link_id,
        (payment as any).paymentLinkId,
      ].filter((id): id is string => typeof id === "string");

      for (const paymentLinkId of possiblePaymentLinkIds) {
        // Try with payment_provider filter first (most common case)
        let { data: orderBySession } = await supabase
          .from("orders")
          .select("id, status, seller_session_id")
          .eq("payment_session_id", paymentLinkId)
          .eq("payment_provider", "square")
          .single();
        
        // If not found, try without payment_provider filter (for orders created before OAuth setup)
        if (!orderBySession) {
          const { data } = await supabase
            .from("orders")
            .select("id, status, seller_session_id")
            .eq("payment_session_id", paymentLinkId)
            .single();
          orderBySession = data;
        }
        
        if (orderBySession) {
          order = orderBySession;
          orderId = order.id;
          console.log(`Square webhook: found order ${order.id} by payment_session_id ${paymentLinkId}`);
          break;
        }
      }

      // Also try to find by querying recent orders with payment_session_id
      // This helps if payment_provider wasn't set correctly
      if (!order && squareOrderId) {
        // First try with payment_provider filter
        let { data: recentOrders } = await supabase
          .from("orders")
          .select("id, status, seller_session_id, payment_session_id, created_at")
          .eq("payment_provider", "square")
          .is("square_payment_id", null)
          .not("payment_session_id", "is", null)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .order("created_at", { ascending: false })
          .limit(50);

        // If no results, try without payment_provider filter
        if (!recentOrders || recentOrders.length === 0) {
          const { data } = await supabase
            .from("orders")
            .select("id, status, seller_session_id, payment_session_id, created_at")
            .is("square_payment_id", null)
            .not("payment_session_id", "is", null)
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order("created_at", { ascending: false })
            .limit(50);
          recentOrders = data;
        }

        if (recentOrders && recentOrders.length > 0) {
          console.log(`Square webhook: checking ${recentOrders.length} recent orders with payment_session_id for match`);
          // Try to match by fetching Square orders for each payment_session_id
          // This is a fallback if we can't get orderId from Square order metadata
        }
      }

      // If still no order, try seller accounts
      if (!order && squareOrderId) {
        // Get all sellers with Square accounts and try each one (refresh token if expired)
        const { data: sellers } = await supabase
          .from("profiles")
          .select("id, square_access_token, square_refresh_token, square_token_expires_at")
          .eq("payment_provider", "square")
          .not("square_access_token", "is", null);

        if (sellers && sellers.length > 0) {
          for (const seller of sellers) {
            if (!seller.square_access_token) continue;

            const validToken = await getValidSquareAccessToken(
              seller.square_access_token,
              seller.square_refresh_token,
              seller.square_token_expires_at,
              seller.id
            );
            if (!validToken) continue;

            try {
              const sellerClient = getSquareClientForSeller(validToken);
              const orderResponse = await sellerClient.orders.get({
                orderId: squareOrderId,
              });
              const squareOrder = (orderResponse as { order?: { metadata?: Record<string, string> } }).order;
              if (squareOrder?.metadata) {
                const metadataOrderId = squareOrder.metadata.orderId as string | undefined;
                if (metadataOrderId) {
                  orderId = metadataOrderId;
                  console.log(
                    `Square webhook: extracted orderId ${orderId} from Square order ${squareOrderId} metadata (seller account: ${seller.id})`
                  );
                  break;
                }
              }
            } catch (sellerErr) {
              // Continue to next seller
              continue;
            }
          }
        }
      }
    }
  }

  // Now try to find the order by orderId if we have it
  if (orderId && !order) {
    const { data } = await supabase
      .from("orders")
      .select("id, status, seller_session_id")
      .eq("id", orderId)
      .single();
    order = data;
  }

  if (!order) {
    console.error(
      `Square webhook payment.completed: order not found (orderId: ${orderId}, paymentId: ${paymentId}, squareOrderId: ${squareOrderId})`
    );
    console.error("Square webhook: payment object keys:", Object.keys(payment));
    console.error("Square webhook: payment object:", JSON.stringify(payment, null, 2));
    return;
  }

  console.log(`Square webhook: marking order ${order.id} as PAID (current status: ${order.status})`);
  
  // Also ensure payment_provider is set to 'square' if it wasn't already
  // This fixes orders created before OAuth setup or with incorrect payment_provider
  const { data: currentOrder } = await supabase
    .from("orders")
    .select("payment_provider")
    .eq("id", order.id)
    .single();
  
  if (currentOrder && currentOrder.payment_provider !== "square") {
    await supabase
      .from("orders")
      .update({ payment_provider: "square" })
      .eq("id", order.id);
    console.log(`Square webhook: updated payment_provider to 'square' for order ${order.id}`);
  }
  
  await markOrderPaid(supabase, order.id, order.status, paymentId ?? null);
  console.log(`Square webhook: successfully processed payment for order ${order.id}`);
}

async function handleTerminalCheckoutUpdated(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  checkoutData: Record<string, unknown>
) {
  const status = checkoutData.status as string | undefined;
  const checkoutId = checkoutData.id as string | undefined;
  const paymentIds = checkoutData.payment_ids as string[] | undefined;

  if (status !== "COMPLETED" || !checkoutId) {
    return;
  }

  // Find the order by payment_session_id (we store the terminal checkout ID there)
  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("payment_session_id", checkoutId)
    .single();

  if (!order) {
    console.error(
      `Square webhook terminal.checkout.updated: order not found for checkout ${checkoutId}`
    );
    return;
  }

  const paymentId = paymentIds?.[0] ?? null;

  // Store the square_payment_id if we have one
  if (paymentId) {
    await supabase
      .from("orders")
      .update({ square_payment_id: paymentId })
      .eq("id", order.id);
  }

  await markOrderPaid(supabase, order.id, order.status, paymentId);
}

async function markOrderPaid(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  orderId: string,
  currentStatus: string,
  squarePaymentId: string | null
) {
  if (currentStatus === "PAID" || currentStatus === "COMPLETED") {
    return;
  }

  const updatePayload: Record<string, unknown> = {
    status: "PAID",
    paid_at: new Date().toISOString(),
  };

  if (squarePaymentId) {
    updatePayload.square_payment_id = squarePaymentId;
    updatePayload.payment_intent_id = squarePaymentId;
  }

  const { error, data } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId)
    .select("id, status")
    .single();

  if (error) {
    console.error(`Failed to mark order ${orderId} as PAID:`, error.message);
  } else if (data) {
    console.log(`Successfully marked order ${orderId} as PAID. New status: ${data.status}`);
  }
}
