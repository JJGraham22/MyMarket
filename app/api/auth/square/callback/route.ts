import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { squareApplicationId } from "@/lib/square";
import { SquareClient, SquareEnvironment } from "square";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const isNative = state?.endsWith(":native") ?? false;

  function redirectSuccess() {
    if (isNative) {
      return NextResponse.redirect("com.mymarket.app://oauth/success", { status: 302 });
    }
    return NextResponse.redirect(`${siteUrl}/settings/payments?success=square`, { status: 302 });
  }

  function redirectError(msg: string) {
    const encoded = encodeURIComponent(msg);
    if (isNative) {
      return NextResponse.redirect(`com.mymarket.app://oauth/error?message=${encoded}`, { status: 302 });
    }
    return NextResponse.redirect(`${siteUrl}/settings/payments?error=${encoded}`, { status: 302 });
  }

  if (oauthError) {
    return redirectError(errorDescription ?? oauthError);
  }

  if (!code || !state) {
    return redirectError("Missing authorization code or state");
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirectError("Not authenticated");

    if (!state.startsWith(user.id)) {
      return redirectError("Invalid state parameter");
    }

    const clientSecret = process.env.SQUARE_CLIENT_SECRET;
    if (!clientSecret) return redirectError("SQUARE_CLIENT_SECRET not configured");

    const environment = process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;

    const redirectUri = `${siteUrl}/api/auth/square/callback`;

    const platformClient = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN ?? "",
      environment,
    });

    const tokenResponse = await platformClient.oAuth.obtainToken({
      clientId: squareApplicationId,
      clientSecret,
      grantType: "authorization_code",
      code,
      redirectUri,
    });

    const { accessToken, refreshToken, expiresAt, merchantId } = tokenResponse;

    if (!accessToken || !merchantId) {
      throw new Error("Invalid token response from Square");
    }

    const sellerClient = new SquareClient({ token: accessToken, environment });
    let locationId: string | null = null;
    try {
      const locationsResponse = await sellerClient.locations.list();
      const locations = locationsResponse.locations ?? [];
      locationId = locations.find((l: { status?: string; id?: string }) => l.status === "ACTIVE")?.id ?? locations[0]?.id ?? null;
    } catch {
      // non-fatal
    }

    const serviceSupabase = createServiceRoleSupabaseClient();
    const { error: dbError } = await serviceSupabase
      .from("profiles")
      .update({
        payment_provider: "square",
        square_merchant_id: merchantId,
        square_access_token: accessToken,
        square_refresh_token: refreshToken ?? null,
        square_token_expires_at: expiresAt ?? null,
        square_location_id: locationId,
      })
      .eq("id", user.id);

    if (dbError) throw new Error("Failed to save Square credentials");

    return redirectSuccess();
  } catch (error) {
    console.error("Square OAuth callback error:", error);
    const message = error instanceof Error ? error.message : "OAuth callback failed";
    return redirectError(message);
  }
}