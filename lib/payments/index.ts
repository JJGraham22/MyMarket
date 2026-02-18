import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { StripeProvider } from "./stripe-provider";
import { SquareProvider } from "./square-provider";
import type { PaymentProvider, SellerPaymentConfig } from "./types";

export type { PaymentProvider, SellerPaymentConfig } from "./types";
export type {
  CheckoutParams,
  CheckoutResult,
  LineItem,
  PaymentProviderType,
  WebhookResult,
  WebhookAction,
} from "./types";

/**
 * Look up the seller's payment configuration from their profile.
 */
export async function getSellerPaymentConfig(
  sellerId: string
): Promise<SellerPaymentConfig> {
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "payment_provider, stripe_connected_account_id, square_merchant_id, square_access_token, square_location_id"
    )
    .eq("id", sellerId)
    .single();

  if (error || !data) {
    // Default to platform payments if profile not found
    return {
      paymentProvider: "platform",
      stripeConnectedAccountId: null,
      squareMerchantId: null,
      squareAccessToken: null,
      squareLocationId: null,
    };
  }

  return {
    paymentProvider: data.payment_provider ?? "platform",
    stripeConnectedAccountId: data.stripe_connected_account_id ?? null,
    squareMerchantId: data.square_merchant_id ?? null,
    squareAccessToken: data.square_access_token ?? null,
    squareLocationId: data.square_location_id ?? null,
  };
}

/**
 * Get the appropriate payment provider for a seller based on their profile settings.
 *
 * - "platform" → Stripe with platform's own account (no connected account)
 * - "stripe"   → Stripe with seller's connected account via Stripe Connect
 * - "square"   → Square with seller's linked Square account
 */
export function getProviderForConfig(
  config: SellerPaymentConfig
): PaymentProvider {
  switch (config.paymentProvider) {
    case "stripe":
      return new StripeProvider(config.stripeConnectedAccountId);

    case "square":
      return new SquareProvider(
        config.squareAccessToken,
        config.squareLocationId
      );

    case "platform":
    default:
      // Platform default: use the platform's Stripe account
      return new StripeProvider(null);
  }
}

/**
 * Convenience: look up seller config and return the provider in one call.
 */
export async function getProviderForSeller(
  sellerId: string
): Promise<PaymentProvider> {
  const config = await getSellerPaymentConfig(sellerId);
  return getProviderForConfig(config);
}

/**
 * Look up the seller ID for an order by traversing order → seller_session → seller_id.
 */
export async function getSellerIdForOrder(
  orderId: string
): Promise<string | null> {
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select("seller_session_id, seller_sessions(seller_id)")
    .eq("id", orderId)
    .single();

  if (error || !data) return null;

  const sessions = data.seller_sessions as unknown as
    | { seller_id: string }
    | { seller_id: string }[]
    | null;

  if (!sessions) return null;

  if (Array.isArray(sessions)) {
    return sessions[0]?.seller_id ?? null;
  }

  return sessions.seller_id ?? null;
}
