/**
 * Payment provider abstraction layer types.
 *
 * All payment providers (Stripe, Square, platform default) implement the
 * PaymentProvider interface so checkout and webhook handling is provider-agnostic.
 */

export type PaymentProviderType = "platform" | "stripe" | "square";

export interface LineItem {
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export interface CheckoutParams {
  orderId: string;
  totalCents: number;
  currency: string;
  lineItems: LineItem[];
  successUrl: string;
  cancelUrl: string;
  email?: string;
  expiresAt?: string;
}

export interface CheckoutResult {
  /** URL to redirect the buyer to for payment */
  redirectUrl: string;
  /** Provider-specific session/checkout ID to store on the order */
  sessionId: string;
}

export type WebhookAction = "paid" | "failed" | "cancelled" | "unknown";

export interface WebhookResult {
  orderId: string | null;
  action: WebhookAction;
  paymentId: string | null;
}

export interface PaymentProvider {
  readonly providerType: PaymentProviderType;

  /**
   * Create a hosted checkout session and return the redirect URL.
   */
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult>;
}

export interface SellerPaymentConfig {
  paymentProvider: PaymentProviderType;
  stripeConnectedAccountId: string | null;
  squareMerchantId: string | null;
  squareAccessToken: string | null;
  squareLocationId: string | null;
}
