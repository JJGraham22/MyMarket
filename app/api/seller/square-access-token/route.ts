import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { getValidSquareAccessToken } from "@/lib/squareRefresh";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const serviceSupabase = createServiceRoleSupabaseClient();
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("id, square_access_token, square_refresh_token, square_token_expires_at, square_merchant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.square_merchant_id || !profile?.square_access_token) {
      return NextResponse.json(
        { error: "Square account not connected. Connect Square in Settings → Payments." },
        { status: 400 }
      );
    }

    const validToken = await getValidSquareAccessToken(
      profile.square_access_token,
      profile.square_refresh_token,
      profile.square_token_expires_at,
      profile.id
    );

    if (!validToken) {
      return NextResponse.json(
        { error: "Square token expired. Reconnect Square in Settings → Payments." },
        { status: 401 }
      );
    }

    return NextResponse.json({ accessToken: validToken });
  } catch (err) {
    console.error("Failed to get Square access token:", err);
    return NextResponse.json({ error: "Failed to retrieve Square access token." }, { status: 500 });
  }
}