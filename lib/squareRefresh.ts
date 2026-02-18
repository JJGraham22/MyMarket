import { SquareClient, SquareEnvironment } from "square";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { squareApplicationId } from "@/lib/square";

const env = process.env.SQUARE_ENVIRONMENT === "production"
  ? SquareEnvironment.Production
  : SquareEnvironment.Sandbox;

/** Consider token expired this many seconds before actual expiry */
const EXPIRY_BUFFER_SEC = 300; // 5 minutes

/**
 * Returns true if the token should be refreshed (expired or missing expiresAt).
 */
export function isTokenExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true;
  try {
    const expiry = new Date(expiresAt).getTime();
    return Date.now() >= expiry - EXPIRY_BUFFER_SEC * 1000;
  } catch {
    return true;
  }
}

/**
 * Refresh a seller's Square access token using their stored refresh token.
 * Updates the profile with the new access_token and expires_at.
 * Returns the new access token, or null if refresh failed.
 */
export async function refreshSquareTokenForUser(userId: string): Promise<string | null> {
  const clientSecret = process.env.SQUARE_CLIENT_SECRET;
  if (!clientSecret || !squareApplicationId) return null;

  const supabase = createServiceRoleSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, square_refresh_token, square_access_token, square_token_expires_at")
    .eq("id", userId)
    .single();

  if (!profile?.square_refresh_token) return null;

  const platformClient = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN ?? "",
    environment: env,
  });

  try {
    const tokenResponse = await platformClient.oAuth.obtainToken({
      clientId: squareApplicationId,
      clientSecret,
      grantType: "refresh_token",
      refreshToken: profile.square_refresh_token,
    });

    const accessToken = tokenResponse.accessToken;
    const expiresAt = tokenResponse.expiresAt;
    const refreshToken = tokenResponse.refreshToken ?? profile.square_refresh_token;

    if (!accessToken) return null;

    await supabase
      .from("profiles")
      .update({
        square_access_token: accessToken,
        square_refresh_token: refreshToken,
        square_token_expires_at: expiresAt ?? null,
      })
      .eq("id", userId);

    return accessToken;
  } catch (err) {
    console.error("Square token refresh failed for user", userId, err);
    return null;
  }
}

/**
 * Get a valid Square access token for a seller: use current token if still valid,
 * otherwise refresh and return the new one. Returns null if no credentials or refresh failed.
 */
export async function getValidSquareAccessToken(
  accessToken: string | null,
  refreshToken: string | null,
  expiresAt: string | null | undefined,
  userId: string
): Promise<string | null> {
  if (!accessToken) return null;
  if (!isTokenExpired(expiresAt)) return accessToken;
  if (!refreshToken) return null;
  return refreshSquareTokenForUser(userId);
}
