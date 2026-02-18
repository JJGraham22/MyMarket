import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { squareApplicationId } from "@/lib/square";
import { SquareClient, SquareEnvironment } from "square";

/**
 * GET /api/auth/square/callback
 * 
 * Handles Square OAuth callback.
 * Exchanges authorization code for access token and stores credentials.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle OAuth errors
    if (error) {
      console.error("Square OAuth error:", error, errorDescription);
      return NextResponse.json(
        { error: "Authorization failed", details: errorDescription || error },
        { status: 400 }
      );
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { error: "Missing state parameter" },
        { status: 400 }
      );
    }

    // Verify user authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate state (CSRF protection)
    if (!state.startsWith(user.id)) {
      console.error("Invalid state:", { state, userId: user.id });
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    // Get environment configuration
    const environment = process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;

    const clientSecret = process.env.SQUARE_CLIENT_SECRET;
    if (!clientSecret) {
      return NextResponse.json(
        { error: "SQUARE_CLIENT_SECRET not configured" },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SITE_URL not configured" },
        { status: 500 }
      );
    }

    const redirectUri = `${siteUrl}/api/auth/square/callback`;

    // Exchange code for token
    const platformClient = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN || "",
      environment,
    });

    console.log("Exchanging authorization code for token...");
    const tokenResponse = await platformClient.oAuth.obtainToken({
      clientId: squareApplicationId,
      clientSecret,
      grantType: "authorization_code",
      code,
      redirectUri,
    });

    const accessToken = tokenResponse.accessToken;
    const refreshToken = tokenResponse.refreshToken;
    const expiresAt = tokenResponse.expiresAt;
    const merchantId = tokenResponse.merchantId;

    if (!accessToken || !merchantId) {
      throw new Error("Invalid token response from Square");
    }

    console.log("Token exchange successful for merchant:", merchantId);

    // Get seller's default location
    const sellerClient = new SquareClient({
      token: accessToken,
      environment,
    });

    let locationId: string | null = null;
    try {
      const locationsResponse = await sellerClient.locations.list();
      const locations = locationsResponse.locations || [];
      const activeLocation = locations.find(loc => loc.status === "ACTIVE");
      locationId = activeLocation?.id || locations[0]?.id || null;
    } catch (err) {
      console.warn("Could not fetch locations:", err);
    }

    // Save credentials to database
    const serviceSupabase = createServiceRoleSupabaseClient();
    const { error: dbError } = await serviceSupabase
      .from("profiles")
      .update({
        payment_provider: "square",
        square_merchant_id: merchantId,
        square_access_token: accessToken,
        square_refresh_token: refreshToken || null,
        square_token_expires_at: expiresAt || null,
        square_location_id: locationId,
      })
      .eq("id", user.id);

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save Square credentials");
    }

    console.log("Square OAuth completed successfully");

    // Redirect back to payment settings so user sees success and updated state
    const redirectUrl = `${siteUrl}/settings/payments?success=square`;
    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error("Square OAuth callback error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "OAuth callback failed", details: message },
      { status: 500 }
    );
  }
}
