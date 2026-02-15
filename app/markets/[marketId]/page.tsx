import { createServerSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();

  // 1. Fetch market
  const { data: market } = await supabase
    .from("markets")
    .select("*")
    .eq("id", params.marketId)
    .single();

  if (!market) {
    notFound();
  }

  // 2. Fetch upcoming market days
  const today = new Date().toISOString().slice(0, 10);
  const { data: marketDays } = await supabase
    .from("market_days")
    .select("id, date, status")
    .eq("market_id", params.marketId)
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(10);

  // 3. Find today's market day (if any)
  const todayMarketDay = marketDays?.find((d) => d.date === today) ?? null;

  // 4. Fetch seller sessions for today's market day, joined with profiles & listings
  let sellerSessions: SellerSession[] = [];

  if (todayMarketDay) {
    const { data } = await supabase
      .from("seller_sessions")
      .select(
        `id, seller_id, stall_number, notes,
         profiles:seller_id ( display_name, avatar_url, role ),
         listings ( id, name, price_cents, unit, qty_available, is_active )`
      )
      .eq("market_day_id", todayMarketDay.id);

    if (data) {
      sellerSessions = (data as unknown as SellerSession[]).map((s) => ({
        ...s,
        // Supabase may return profile as object or array; normalise
        profile: Array.isArray(s.profile) ? s.profile[0] ?? null : s.profile,
        // Only active listings with stock, limit preview to 5
        listings: (s.listings ?? [])
          .filter((l) => l.is_active && l.qty_available > 0)
          .slice(0, 5),
      }));
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

      <header className="space-y-2">
        <h1 className="page-heading">{market.name}</h1>
        {(market.suburb || market.city) && (
          <p className="page-subheading !mt-1">
            {[market.suburb, market.city].filter(Boolean).join(", ")}
          </p>
        )}
        {market.address && (
          <p className="text-sm text-[var(--cream-muted)]">{market.address}</p>
        )}
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
          {todayMarketDay ? "Sellers at today\u2019s market" : "Sellers"}
        </h2>
        {!todayMarketDay ? (
          <div className="card-organic px-6 py-10 text-center">
            <p className="text-sm text-[var(--cream-muted)]">No market day today. Check back on the next scheduled date.</p>
          </div>
        ) : sellerSessions.length === 0 ? (
          <div className="card-organic px-6 py-10 text-center">
            <p className="text-sm text-[var(--cream-muted)]">No sellers have registered for today yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sellerSessions.map((session) => {
              const name = session.profile?.display_name ?? "Unknown Seller";
              const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <Link
                  key={session.id}
                  href={`/sellers/${session.seller_id}`}
                  className="card-organic group p-5 transition-colors hover:border-[var(--green-soft)]/30"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: "var(--green-bg)", color: "var(--green-pale)" }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[var(--cream)] group-hover:text-[var(--green-pale)]">{name}</h3>
                      {session.stall_number && <p className="text-xs text-[var(--cream-muted)]">Stall {session.stall_number}</p>}
                    </div>
                  </div>
                  {session.listings.length > 0 ? (
                    <ul className="space-y-1">
                      {session.listings.map((listing) => (
                        <li key={listing.id} className="flex items-center justify-between text-xs">
                          <span className="truncate text-[var(--cream-muted)]">{listing.name}{listing.unit && ` / ${listing.unit}`}</span>
                          <span className="ml-2 shrink-0" style={{ color: "var(--green-pale)" }}>${(listing.price_cents / 100).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[var(--cream-muted)]">No listings yet</p>
                  )}
                  <span className="mt-3 block text-sm font-medium" style={{ color: "var(--green-pale)" }}>View seller &rarr;</span>
                </Link>
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
