import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SaveMarketButton } from "@/app/components/SaveMarketButton";
import { SellerOrderCard } from "./SellerOrderCard";

interface MarketDetailProps {
  params: { marketId: string };
}

interface SellerSession {
  id: string;
  seller_id: string;
  stall_number: string | null;
  notes: string | null;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    role: string;
  } | null;
  listings: {
    id: string;
    name: string;
    price_cents: number;
    unit: string | null;
    qty_available: number;
    is_active: boolean;
  }[];
}

export async function generateMetadata({ params }: MarketDetailProps) {
  const supabase = createServiceRoleSupabaseClient();
  const { data: market } = await supabase
    .from("markets")
    .select("name")
    .eq("id", params.marketId)
    .single();

  return {
    title: market
      ? `${market.name} — My Market`
      : "Market — My Market",
  };
}

export default async function MarketDetailPage({ params }: MarketDetailProps) {
  const supabase = createServiceRoleSupabaseClient();

  // 1. Fetch market
  const { data: market } = await supabase
    .from("markets")
    .select("*")
    .eq("id", params.marketId)
    .single();

  if (!market) {
    notFound();
  }

  // 2. Fetch market days (today and future, plus recent past for completeness)
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);
  
  // Fetch today and future market days, plus recent past (last 7 days) to show current sellers
  const { data: marketDays } = await supabase
    .from("market_days")
    .select("id, date, status")
    .eq("market_id", params.marketId)
    .gte("date", sevenDaysAgoStr) // Include last 7 days to today and future
    .order("date", { ascending: true })
    .limit(20);

  // 3. Find today's market day (if any) and get all market day IDs (recent past, today, and future)
  const todayMarketDay = marketDays?.find((d) => d.date === today) ?? null;
  const allMarketDayIds = marketDays?.map((d) => d.id) ?? [];

  // 4. Fetch seller sessions for ALL market days (recent past, today, and future), joined with profiles
  let sellerSessions: SellerSession[] = [];
  const sellerSessionsMap = new Map<string, SellerSession>(); // Deduplicate by seller_id

  if (allMarketDayIds.length > 0) {
    // First, fetch seller sessions
    const { data: sessionData } = await supabase
      .from("seller_sessions")
      .select("id, seller_id, stall_number, notes, market_day_id")
      .in("market_day_id", allMarketDayIds);

    if (sessionData && sessionData.length > 0) {
      // Get unique seller IDs and session IDs
      const sellerIds = Array.from(new Set((sessionData as any[]).map((s) => s.seller_id)));
      const sessionIds = (sessionData as any[]).map((s) => s.id);

      // Fetch profiles separately for all sellers
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, role")
        .in("id", sellerIds);

      // Create a map of seller_id -> profile
      const profilesMap = new Map<string, { display_name: string | null; avatar_url: string | null; role: string }>();
      (profilesData ?? []).forEach((p: any) => {
        profilesMap.set(p.id, {
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          role: p.role,
        });
      });

      // Fetch all listings for these sessions
      let allListings: Array<{
        id: string;
        name: string;
        price_cents: number;
        unit: string | null;
        qty_available: number;
        is_active: boolean;
        seller_session_id: string;
      }> = [];

      if (sessionIds.length > 0) {
        const { data: listingsData } = await supabase
          .from("listings")
          .select("id, name, price_cents, unit, qty_available, is_active, seller_session_id")
          .in("seller_session_id", sessionIds)
          .eq("is_active", true);

        allListings = (listingsData ?? []) as typeof allListings;
      }

      // Group listings by session ID
      const listingsBySessionId = new Map<string, typeof allListings>();
      allListings.forEach((listing) => {
        const sessionId = listing.seller_session_id;
        if (!listingsBySessionId.has(sessionId)) {
          listingsBySessionId.set(sessionId, []);
        }
        listingsBySessionId.get(sessionId)!.push(listing);
      });

      // Process all sessions and deduplicate sellers (keep the most recent session per seller)
      (sessionData as any[]).forEach((s) => {
        const existing = sellerSessionsMap.get(s.seller_id);
        const sessionListings = listingsBySessionId.get(s.id) ?? [];
        const profile = profilesMap.get(s.seller_id) ?? null;
        
        if (!existing || (s.id && (!existing.id || s.id > existing.id))) {
          sellerSessionsMap.set(s.seller_id, {
            id: s.id,
            seller_id: s.seller_id,
            stall_number: s.stall_number,
            notes: s.notes,
            profile: profile,
            // Show all active listings (even with 0 stock), limit preview to 10
            listings: sessionListings.slice(0, 10),
          });
        } else {
          // Merge listings from multiple sessions for the same seller
          const existingListings = existing.listings ?? [];
          const mergedListings = [...existingListings, ...sessionListings];
          // Deduplicate by listing id and limit to 10
          const uniqueListings = Array.from(
            new Map(mergedListings.map((l) => [l.id, l])).values()
          ).slice(0, 10);
          sellerSessionsMap.set(s.seller_id, {
            ...existing,
            listings: uniqueListings,
          });
        }
      });

      sellerSessions = Array.from(sellerSessionsMap.values());
    }
  }

  return (
    <div className="space-y-12">
      <Link
        href="/markets"
        className="inline-flex items-center gap-1 text-sm text-[var(--cream-muted)] transition-colors hover:text-[var(--green-pale)]"
      >
        &larr; Back to markets
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <h1 className="page-heading">{market.name}</h1>
          {(market.suburb || market.city) && (
            <p className="page-subheading !mt-1">
              {[market.suburb, market.city].filter(Boolean).join(", ")}
            </p>
          )}
          {market.address && (
            <p className="text-sm text-[var(--cream-muted)]">{market.address}</p>
          )}
        </div>
        <SaveMarketButton marketId={market.id} />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {market.lat && market.lng && (
          <div className="card-organic p-5">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--cream-muted)]">Location</h2>
            <p className="text-sm text-[var(--cream)]">{market.lat.toFixed(4)}, {market.lng.toFixed(4)}</p>
            <a
              href={`https://www.google.com/maps?q=${market.lat},${market.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium"
              style={{ color: "var(--green-pale)" }}
            >
              Open in Google Maps &rarr;
            </a>
          </div>
        )}
        <div className="card-organic p-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--cream-muted)]">Today</h2>
          {todayMarketDay ? (
            <>
              <p className="text-lg font-bold" style={{ color: "var(--green-pale)" }}>{todayMarketDay.status ?? "OPEN"}</p>
              <p className="text-xs text-[var(--cream-muted)]">{sellerSessions.length} seller{sellerSessions.length !== 1 ? "s" : ""} registered</p>
            </>
          ) : (
            <p className="text-sm text-[var(--cream-muted)]">No market today</p>
          )}
        </div>
        <div className="card-organic p-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--cream-muted)]">Upcoming</h2>
          <p className="text-2xl font-bold text-[var(--cream)]">{marketDays?.length ?? 0}</p>
          <p className="text-xs text-[var(--cream-muted)]">scheduled from today</p>
        </div>
      </section>

      <section>
        <h2 className="section-heading mb-4">
          {todayMarketDay ? "Sellers at today\u2019s market" : sellerSessions.length > 0 ? "Sellers at upcoming markets" : "Sellers"}
        </h2>
        {sellerSessions.length === 0 && allMarketDayIds.length === 0 ? (
          <div className="card-organic px-6 py-10 text-center">
            <p className="text-sm text-[var(--cream-muted)]">No market days scheduled for this market.</p>
          </div>
        ) : sellerSessions.length === 0 ? (
          <div className="card-organic px-6 py-10 text-center">
            <p className="text-sm text-[var(--cream-muted)]">
              No sellers have registered for this market yet. {todayMarketDay ? "Check back later or sellers may register soon." : "Sellers will appear here when they register for upcoming market days."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sellerSessions.map((session) => {
              const name = session.profile?.display_name ?? "Unknown Seller";
              const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <SellerOrderCard
                  key={session.id}
                  sellerId={session.seller_id}
                  sellerName={name}
                  sellerInitials={initials}
                  stallNumber={session.stall_number}
                  listings={session.listings}
                  sessionId={session.id}
                />
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-heading mb-4">Upcoming market days</h2>
        {!marketDays || marketDays.length === 0 ? (
          <div className="card-organic px-6 py-10 text-center">
            <p className="text-sm text-[var(--cream-muted)]">No upcoming market days scheduled.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {marketDays.map((day) => {
              const isToday = day.date === today;
              return (
                <div
                  key={day.id}
                  className={`card-organic flex items-center justify-between px-4 py-3 ${isToday ? "border-[var(--green-soft)]/30" : ""}`}
                  style={isToday ? { background: "var(--green-bg)" } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--cream)]">
                      {new Date(day.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    {isToday && (
                      <span className="badge-soft rounded-full px-2 py-0.5 text-[0.65rem] font-medium">Today</span>
                    )}
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: day.status === "OPEN" ? "var(--green-pale)" : day.status === "CLOSED" ? "#c95a5a" : "var(--cream-muted)" }}
                  >
                    {day.status ?? "PLANNED"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
