import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSquareClientForSeller } from "@/lib/square";
import {
  getValidSquareAccessToken,
} from "@/lib/squareRefresh";

/**
 * GET /api/auth/square/status
 *
 * Returns whether the current user has Square connected and if the stored
 * token is still valid (or was successfully refreshed). Use this to show
 * "Reconnect Square" when connected but token is invalid/expired.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ connected: false, valid: false }, { status: 200 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, square_merchant_id, square_access_token, square_refresh_token, square_token_expires_at"
      )
      .eq("id", user.id)
      .single();

    if (!profile?.square_merchant_id || !profile.square_access_token) {
      return NextResponse.json({ connected: false, valid: false }, { status: 200 });
    }

    const validToken = await getValidSquareAccessToken(
      profile.square_access_token,
      profile.square_refresh_token,
      profile.square_token_expires_at,
      profile.id
    );

    if (!validToken) {
      return NextResponse.json(
        { connected: true, valid: false, message: "Token expired or refresh failed" },
        { status: 200 }
      );
    }

    try {
      const client = getSquareClientForSeller(validToken);
      await client.locations.list();
    } catch {
      return NextResponse.json(
        { connected: true, valid: false, message: "Square API call failed" },
        { status: 200 }
      );
    }

    return NextResponse.json({ connected: true, valid: true }, { status: 200 });
  } catch (err) {
    console.error("Square status check error:", err);
    return NextResponse.json(
      { connected: false, valid: false, error: "Status check failed" },
      { status: 200 }
    );
  }
}
