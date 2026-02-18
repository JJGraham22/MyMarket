import { SquareClient, SquareEnvironment } from "square";

/**
 * Server-side Square client (lazy-initialised).
 *
 * Uses SQUARE_ACCESS_TOKEN for the *platform's own* Square account.
 * Individual seller tokens are passed per-request when needed.
 *
 * Where to get your keys
 * ──────────────────────
 *   1. Go to https://developer.squareup.com/apps
 *   2. Create or select your application
 *   3. Copy "Access Token" → paste as SQUARE_ACCESS_TOKEN in .env.local
 *   4. Copy "Application ID" → paste as SQUARE_APPLICATION_ID in .env.local
 *   5. Go to OAuth page → Copy "Application Secret" → paste as SQUARE_CLIENT_SECRET in .env.local
 *   6. For webhooks: Settings → Webhooks → copy Signature Key →
 *      paste as SQUARE_WEBHOOK_SIGNATURE_KEY in .env.local
 *   7. Configure OAuth redirect URI: http://localhost:3000/api/auth/square/callback
 *      (or your production URL) in Square Developer Console → OAuth → Redirect URLs
 *
 * IMPORTANT: Only import this file from server-side code (API routes, Server
 * Components, server actions). Never import it from a "use client" component.
 */

let _squareClient: SquareClient | null = null;

function getEnvironment(): SquareEnvironment {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;
}

/**
 * Return a configured Square client using the platform's own credentials.
 *
 * Throws immediately if SQUARE_ACCESS_TOKEN is missing so the caller gets a
 * clear error instead of a cryptic SDK failure.
 */
export function getSquareClient(): SquareClient {
  if (_squareClient) return _squareClient;

  const token = process.env.SQUARE_ACCESS_TOKEN;

  if (!token) {
    throw new Error(
      "Missing SQUARE_ACCESS_TOKEN. Add it to .env.local — see https://developer.squareup.com/apps"
    );
  }

  _squareClient = new SquareClient({
    token,
    environment: getEnvironment(),
  });

  return _squareClient;
}

/**
 * Return a Square client configured with a specific seller's access token.
 * Used when a seller has linked their own Square account via OAuth.
 */
export function getSquareClientForSeller(sellerAccessToken: string): SquareClient {
  return new SquareClient({
    token: sellerAccessToken,
    environment: getEnvironment(),
  });
}

/**
 * Square Application ID — needed for OAuth flows and webhooks.
 */
export const squareApplicationId = process.env.SQUARE_APPLICATION_ID ?? "";

/**
 * Square webhook signature key for verifying incoming webhooks.
 */
export const squareWebhookSignatureKey =
  process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "";
