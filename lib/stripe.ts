import Stripe from "stripe";

/**
 * Server-side Stripe instance (lazy-initialised).
 *
 * Uses STRIPE_SECRET_KEY which must be set in .env.local (never expose it to
 * the browser — it does NOT use a NEXT_PUBLIC_ prefix on purpose).
 *
 * Where to get your keys
 * ──────────────────────
 *   1. Go to https://dashboard.stripe.com/apikeys
 *   2. Copy "Secret key" → paste as STRIPE_SECRET_KEY in .env.local
 *   3. For webhooks: https://dashboard.stripe.com/webhooks → reveal signing
 *      secret → paste as STRIPE_WEBHOOK_SECRET in .env.local
 *   4. During local development you can use Stripe CLI to forward events:
 *        stripe listen --forward-to localhost:3000/api/stripe/webhook
 *      The CLI will print a webhook signing secret — use that for
 *      STRIPE_WEBHOOK_SECRET.
 *
 * IMPORTANT: Only import this file from server-side code (API routes, Server
 * Components, server actions). Never import it from a "use client" component.
 */

let _stripe: Stripe | null = null;

/**
 * Return a configured Stripe instance for server-side use.
 *
 * Throws immediately if STRIPE_SECRET_KEY is missing so the caller gets a
 * clear error instead of a cryptic Stripe SDK failure.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY. Add it to .env.local — see https://dashboard.stripe.com/apikeys"
    );
  }

  _stripe = new Stripe(key, {
    // Pin to the API version shipped with the installed SDK.
    // Update this when you intentionally upgrade the stripe package.
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });

  return _stripe;
}

/**
 * Webhook signing secret used to verify incoming Stripe webhook events.
 *
 * Optional at startup (you can still run the app without webhooks), but
 * required at runtime when processing webhook requests.
 */
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
