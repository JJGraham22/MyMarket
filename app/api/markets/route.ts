import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
  const openToday = searchParams.get("openToday") === "true";

  const supabase = createServiceRoleSupabaseClient();

  // Build base query
  let query = supabase
    .from("markets")
    .select("id, name, city, suburb, address, lat, lng, created_at");

  // Filter by search (name or suburb, case-insensitive)
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,suburb.ilike.%${search}%`
    );
  }

  // Filter by city
  if (city) {
    query = query.ilike("city", city);
  }

  query = query.order("name", { ascending: true });

  const { data: markets, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If openToday filter is on, narrow results to markets that have a market_day today
  if (openToday && markets && markets.length > 0) {
    const marketIds = markets.map((m: { id: string }) => m.id);

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const { data: todayDays } = await supabase
      .from("market_days")
      .select("market_id")
      .in("market_id", marketIds)
      .eq("date", today);

    if (todayDays) {
      const openIds = new Set(todayDays.map((d: { market_id: string }) => d.market_id));
      const filtered = markets.filter((m: { id: string }) => openIds.has(m.id));
      return NextResponse.json({ markets: filtered });
    }
  }

  return NextResponse.json({ markets: markets ?? [] });
}
