import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const location = req.nextUrl.searchParams.get("location")?.trim() ?? "";

  if (!q && !location) {
    return NextResponse.json({ markets: [], sellers: [] });
  }

  const supabase = createServiceRoleSupabaseClient();

  // ── Markets search ────────────────────────────────────
  let marketsQuery = supabase
    .from("markets")
    .select("id, name, city, suburb, address")
    .order("name", { ascending: true })
    .limit(12);

  if (q) {
    marketsQuery = marketsQuery.or(
      `name.ilike.%${q}%,suburb.ilike.%${q}%,city.ilike.%${q}%`
    );
  }
  if (location) {
    marketsQuery = marketsQuery.ilike("city", `%${location}%`);
  }

  // ── Sellers search ────────────────────────────────────
  let sellersQuery = supabase
    .from("profiles")
    .select("id, display_name, tagline, logo_url, role")
    .eq("role", "seller")
    .order("display_name", { ascending: true })
    .limit(12);

  if (q) {
    sellersQuery = sellersQuery.or(
      `display_name.ilike.%${q}%,tagline.ilike.%${q}%,bio.ilike.%${q}%`
    );
  }

  // Run in parallel
  const [marketsRes, sellersRes] = await Promise.all([
    marketsQuery,
    sellersQuery,
  ]);

  return NextResponse.json({
    markets: marketsRes.data ?? [],
    sellers: sellersRes.data ?? [],
  });
}
