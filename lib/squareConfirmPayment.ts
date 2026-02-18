import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { getSquareClientForSeller } from "@/lib/square";
import { getValidSquareAccessToken } from "@/lib/squareRefresh";

/**
 * When the customer is redirected to the success page after paying with Square,
 * the webhook may not have run yet (or cannot run on localhost). This function
 * checks Square's API for the order payment status and marks our order PAID if
 * the Square order is COMPLETED. Call it from the success page for Square orders.
 */
export async function confirmSquarePaymentIfPaid(orderId: string): Promise<boolean> {
  const supabase = createServiceRoleSupabaseClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, payment_provider, payment_session_id, seller_session_id, seller_sessions(seller_id)")
    .eq("id", orderId)
    .single();

  if (!order || order.status !== "PENDING_PAYMENT" || order.payment_provider !== "square" || !order.payment_session_id) {
    if (order && order.status === "PENDING_PAYMENT" && order.payment_provider !== "square") {
      console.log(`confirmSquarePaymentIfPaid: skip order ${orderId} (provider=${order.payment_provider}, hasSession=${!!order.payment_session_id})`);
    }
    return false;
  }

  const sessions = order.seller_sessions as unknown as { seller_id: string } | { seller_id: string }[] | null;
  const sellerId = Array.isArray(sessions) ? sessions[0]?.seller_id : sessions?.seller_id;
  if (!sellerId) {
    console.log(`confirmSquarePaymentIfPaid: no seller_id for order ${orderId} (seller_sessions=${JSON.stringify(sessions)})`);
    return false;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, square_access_token, square_refresh_token, square_token_expires_at")
    .eq("id", sellerId)
    .single();

  if (!profile?.square_access_token) {
    console.log(`confirmSquarePaymentIfPaid: no Square token for seller ${sellerId}, order ${orderId}`);
    return false;
  }

  const validToken = await getValidSquareAccessToken(
    profile.square_access_token,
    profile.square_refresh_token,
    profile.square_token_expires_at,
    profile.id
  );
  if (!validToken) {
    console.log(`confirmSquarePaymentIfPaid: invalid/expired Square token for seller ${sellerId}, order ${orderId}`);
    return false;
  }

  const tryConfirm = async (): Promise<boolean> => {
    const client = getSquareClientForSeller(validToken);

    const linkResponse = await client.checkout.paymentLinks.get({
      id: order.payment_session_id,
    });
    // SDK unwraps on await: result is GetPaymentLinkResponse (has .paymentLink)
    const paymentLink = (linkResponse as { paymentLink?: { orderId?: string } }).paymentLink;
    const squareOrderId = paymentLink?.orderId;
    if (!squareOrderId) {
      console.log(`confirmSquarePaymentIfPaid: no orderId on payment link ${order.payment_session_id}, order ${orderId}`);
      return false;
    }

    const orderResponse = await client.orders.get({
      orderId: squareOrderId,
    });
    // SDK unwraps on await: result is GetOrderResponse (has .order)
    const squareOrder = (orderResponse as { order?: { state?: string; tenders?: unknown[] } }).order;
    const state = squareOrder?.state;
    const hasTenders = Array.isArray(squareOrder?.tenders) && squareOrder.tenders.length > 0;
    // COMPLETED = order closed; tenders present = payment was taken (order may still be OPEN briefly)
    if (state !== "COMPLETED" && !hasTenders) {
      console.log(`confirmSquarePaymentIfPaid: Square order ${squareOrderId} state="${state}", tenders=${squareOrder?.tenders?.length ?? 0} (not paid yet), order ${orderId}`);
      return false;
    }

    await supabase
      .from("orders")
      .update({
        status: "PAID",
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    console.log(`confirmSquarePaymentIfPaid: marked order ${orderId} PAID (Square order ${squareOrderId})`);
    return true;
  };

  try {
    if (await tryConfirm()) return true;
    // Redirect can happen before Square adds tenders or sets order COMPLETED; retry with backoff
    for (const delayMs of [1500, 3000]) {
      await new Promise((r) => setTimeout(r, delayMs));
      if (await tryConfirm()) return true;
    }
    return false;
  } catch (err) {
    console.error(`confirmSquarePaymentIfPaid failed for order ${orderId}:`, err);
    return false;
  }
}
