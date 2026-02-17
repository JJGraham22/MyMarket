import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sellerSessionId = url.searchParams.get("sellerSessionId");
  const q = url.searchParams.get("q") ?? "";

  if (!sellerSessionId) {
    return NextResponse.json({ error: "sellerSessionId is required" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  let query = supabase
    .from("listings")
    .select("id, name, unit, price_cents, qty_available, qty_reserved")
    .eq("seller_session_id", sellerSessionId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (q.trim().length > 0) {
    query = query.ilike("name", `%${q.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

