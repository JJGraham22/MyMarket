import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import type {
  PaymentProvider,
  CheckoutParams,
  CheckoutResult,
} from "./types";

/**
 * Stripe payment provider.
 *
 * Uses the platform's Stripe account by default. If a connectedAccountId is
 * provided, payments are routed to the seller's linked Stripe account via
 * Stripe Connect.
 */
export class StripeProvider implements PaymentProvider {
  readonly providerType = "stripe" as const;
  private connectedAccountId: string | null;

  constructor(connectedAccountId: string | null = null) {
    this.connectedAccountId = connectedAccountId;
  }

  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult> {
    const stripe = getStripe();

    const lineItems = params.lineItems.map((item) => ({
      price_data: {
        currency: params.currency,
        unit_amount: item.unitPriceCents,
        product_data: {
          name: item.name,
        },
      },
      quantity: item.quantity,
    }));

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      metadata: { orderId: params.orderId },
      ...(params.email ? { customer_email: params.email } : {}),
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      ...(params.expiresAt
        ? {
            expires_at: Math.max(
              Math.floor(new Date(params.expiresAt).getTime() / 1000),
              Math.floor(Date.now() / 1000) + 30 * 60
            ),
          }
        : {}),
    };

    // Route payment to seller's connected Stripe account if available
    if (this.connectedAccountId) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: this.connectedAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return {
      redirectUrl: session.url,
      sessionId: session.id,
    };
  }
}
