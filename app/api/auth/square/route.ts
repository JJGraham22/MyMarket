import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { squareApplicationId } from "@/lib/square";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const returnJson = searchParams.get("json") === "true";
  const platform = searchParams.get("platform");

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (returnJson) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/auth?next=/settings/payments", req.url));
    }

    if (!squareApplicationId) {
      return NextResponse.json({ error: "SQUARE_APPLICATION_ID not configured" }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL not configured" }, { status: 500 });
    }

    const isSandbox = process.env.SQUARE_ENVIRONMENT?.toLowerCase().trim() !== "production";
    const authorizeUrl = isSandbox
      ? "https://connect.squareupsandbox.com/oauth2/authorize"
      : "https://connect.squareup.com/oauth2/authorize";

    const redirectUri = `${siteUrl}/api/auth/square/callback`;
    const nonce = randomUUID();
    const state = platform === "native"
      ? `${user.id}:${nonce}:native`
      : `${user.id}:${nonce}`;

    const scopes = [
      "PAYMENTS_READ",
      "PAYMENTS_WRITE",
      "MERCHANT_PROFILE_READ",
      "ITEMS_READ",
      "ORDERS_READ",
      "ORDERS_WRITE",
      "DEVICE_CREDENTIAL_MANAGEMENT",
    ].join(" ");

    const params = new URLSearchParams({
      client_id: squareApplicationId,
      scope: scopes,
      state,
      redirect_uri: redirectUri,
    });

    const fullUrl = `${authorizeUrl}?${params.toString()}`;

    if (returnJson) {
      return NextResponse.json({ url: fullUrl });
    }

    return NextResponse.redirect(fullUrl, { status: 302 });
  } catch (error) {
    console.error("Square OAuth initiation error:", error);
    if (returnJson) {
      return NextResponse.json({ error: "Failed to initiate Square OAuth" }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/settings/payments?error=oauth_failed", req.url));
  }
}