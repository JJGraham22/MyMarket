import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { getSquareClientForSeller } from "@/lib/square";
import { getValidSquareAccessToken } from "@/lib/squareRefresh";

/**
 * POST /api/square/terminal/pair
 *
 * Creates a device code for pairing a Square Terminal with the seller's account.
 * The seller enters this code on their Terminal device to pair it.
 */
export async function POST(req: NextRequest) {
  // Suppress unused variable warning — req is required by Next.js route signature
  void req;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const serviceSupabase = createServiceRoleSupabaseClient();
  const { data: profile, error: profileError } = await serviceSupabase
    .from("profiles")
    .select("id, payment_provider, square_access_token, square_refresh_token, square_token_expires_at, square_location_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (!profile.square_access_token) {
    return NextResponse.json(
      { error: "Square account not connected. Please connect Square first." },
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
      { error: "Square token expired. Please reconnect Square in payment settings." },
      { status: 400 }
    );
  }

  try {
    const client = getSquareClientForSeller(validToken);

    // Get the location ID
    let locationId = profile.square_location_id;
    if (!locationId) {
      const locResponse = await client.locations.list();
      const locations = locResponse.locations ?? [];
      const active = locations.find((loc) => loc.status === "ACTIVE");
      locationId = active?.id ?? null;
    }

    if (!locationId) {
      return NextResponse.json(
        { error: "No active Square location found." },
        { status: 400 }
      );
    }

    // Create a device code for pairing
    const response = await client.devices.codes.create({
      idempotencyKey: `pair-${user.id}-${Date.now()}`,
      deviceCode: {
        productType: "TERMINAL_API",
        locationId,
        name: `MyMarket Terminal - ${user.id.slice(0, 8)}`,
      },
    });

    const deviceCode = response.deviceCode;

    if (!deviceCode?.code || !deviceCode?.id) {
      throw new Error("Square did not return a device code.");
    }

    return NextResponse.json({
      pairingCode: deviceCode.code,
      deviceCodeId: deviceCode.id,
      status: deviceCode.status,
      expiresAt: deviceCode.pairBy,
    });
  } catch (err: unknown) {
    console.error("Failed to create device pairing code:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create pairing code.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * GET /api/square/terminal/pair?deviceCodeId=...
 *
 * Polls the status of a device code to check if pairing is complete.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceCodeId = searchParams.get("deviceCodeId");

  if (!deviceCodeId) {
    return NextResponse.json(
      { error: "deviceCodeId is required." },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const serviceSupabase = createServiceRoleSupabaseClient();
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("id, square_access_token, square_refresh_token, square_token_expires_at")
    .eq("id", user.id)
    .single();

  if (!profile?.square_access_token) {
    return NextResponse.json(
      { error: "Square not connected." },
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
      { error: "Square token expired. Reconnect Square in payment settings." },
      { status: 400 }
    );
  }

  try {
    const client = getSquareClientForSeller(validToken);
    const response = await client.devices.codes.get({ id: deviceCodeId });
    const deviceCode = response.deviceCode;

    if (!deviceCode) {
      return NextResponse.json(
        { error: "Device code not found." },
        { status: 404 }
      );
    }

    // If paired, save the device ID on the profile
    if (deviceCode.status === "PAIRED" && deviceCode.deviceId) {
      await serviceSupabase
        .from("profiles")
        .update({ square_device_id: deviceCode.deviceId })
        .eq("id", user.id);
    }

    return NextResponse.json({
      status: deviceCode.status,
      deviceId: deviceCode.deviceId ?? null,
      pairingCode: deviceCode.code,
    });
  } catch (err: unknown) {
    console.error("Failed to get device code status:", err);
    const message =
      err instanceof Error ? err.message : "Failed to check pairing status.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
