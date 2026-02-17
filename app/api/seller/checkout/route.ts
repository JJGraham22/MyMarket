import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";

type CheckoutItem = {
  listingId: string;
  quantity: number;
};

export async function POST(req: NextRequest) {
  const supabase = createServiceRoleSupabaseClient();

  let body: { sellerSessionId?: string; items?: CheckoutItem[]; customerId?: string | null };
  try {
    body = (await req.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sellerSessionId, items, customerId } = body;

  if (!sellerSessionId) {
    return NextResponse.json({ error: "sellerSessionId is required" }, { status: 400 });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items must be a non-empty array" }, { status: 400 });
  }

  const normalizedItems = items.map((item) => ({
    listing_id: item.listingId,
    quantity: item.quantity
  }));

  const { data, error } = await supabase.rpc("create_order_with_reservation", {
    p_seller_session_id: sellerSessionId,
    p_items: normalizedItems,
    p_customer_id: customerId ?? null
  });

  if (error) {
    const isInventoryError =
      typeof error.message === "string" &&
      error.message.toUpperCase().includes("INSUFFICIENT_INVENTORY");

    return NextResponse.json(
      {
        error: isInventoryError
          ? "Insufficient inventory for one or more listings."
          : error.message
      },
      { status: isInventoryError ? 409 : 500 }
    );
  }

  const payload = data as { order_id: string; total_cents: number; expires_at: string };

  const orderId = payload.order_id;
  const totalCents = payload.total_cents;
  const expiresAt = payload.expires_at;

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_URL;

  const payUrl = origin ? `${origin}/pay/${orderId}` : `/pay/${orderId}`;

  return NextResponse.json({
    orderId,
    totalCents,
    expiresAt,
    payUrl
  });
}

