import { createServerSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { notFound } from "next/navigation";

interface SellerPageProps {
  params: { sellerId: string };
}

export async function generateMetadata({ params }: SellerPageProps) {
  const supabase = createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", params.sellerId)
    .single();

  const name = profile?.display_name ?? "Seller";
  return { title: `${name} — My Market` };
}

export default async function SellerPage({ params }: SellerPageProps) {
  const supabase = createServerSupabaseClient();

  // 1. Fetch profile (including new customization fields)
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, bio, avatar_url, role, created_at, logo_url, banner_url, tagline, theme_color"
    )
    .eq("id", params.sellerId)
    .single();

  if (!profile) {
    notFound();
  }

  const name = profile.display_name ?? "Unknown Seller";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const accent = profile.theme_color ?? "#4a7c23";

  // 2. Fetch recent seller sessions with market info
  const { data: sessions } = await supabase
    .from("seller_sessions")
    .select(
      `id, stall_number, created_at,
       market_days!inner ( id, date, status, market_id,
         markets:market_id ( id, name, city, suburb )
       )`
    )
    .eq("seller_id", params.sellerId)
    .order("created_at", { ascending: false })
    .limit(10);

  // 3. Fetch current / recent listings across all sessions
  const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);
  let listings: {
    id: string;
    name: string;
    price_cents: number;
    unit: string | null;
    qty_available: number;
    seller_session_id: string;
  }[] = [];

  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from("listings")
      .select("id, name, price_cents, unit, qty_available, seller_session_id")
      .in("seller_session_id", sessionIds)
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(20);

    listings = data ?? [];
  }

  return (
    <div
      style={
        { "--seller-accent": accent } as React.CSSProperties
      }
    >
      {/* ── Banner hero ──────────────────────────────────── */}
      <div className="relative -mx-4 -mt-6 mb-8 overflow-hidden rounded-b-2xl">
        {profile.banner_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.banner_url}
              alt=""
              className="h-48 w-full object-cover sm:h-56"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--ground)] via-[var(--ground)]/40 to-transparent" />
          </>
        ) : (
          <div
            className="h-48 w-full sm:h-56"
            style={{
              background: `linear-gradient(135deg, ${accent}33 0%, #1a1814 60%, ${accent}22 100%)`,
            }}
          />
        )}

        {/* Back link overlaid on banner */}
        <Link
          href="/markets"
          className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm backdrop-blur-sm transition-colors"
          style={{ background: "var(--ground-elevated)", color: "var(--cream-muted)", border: "1px solid rgba(168,137,104,0.2)" }}
        >
          &larr; Back to markets
        </Link>

        {/* Logo + name overlapping bottom of banner */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <div className="flex items-end gap-4">
            {/* Logo / avatar */}
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 shadow-lg"
              style={{
                borderColor: accent,
                backgroundColor: profile.logo_url ? "transparent" : "var(--ground-elevated)",
              }}
            >
              {profile.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.logo_url}
                  alt={`${name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="text-2xl font-bold"
                  style={{ color: accent }}
                >
                  {initials}
                </span>
              )}
            </div>

            {/* Name + tagline */}
            <div className="mb-1 min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-white drop-shadow-md sm:text-2xl">
                {name}
              </h1>
              {profile.tagline && (
                <p className="mt-0.5 truncate text-sm text-slate-300/90 drop-shadow-sm">
                  {profile.tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3 text-xs text-[var(--cream-muted)]">
        <span
          className="rounded-full border px-2 py-0.5 font-medium"
          style={{
            borderColor: accent + "66",
            color: accent,
            backgroundColor: accent + "15",
          }}
        >
          {profile.role === "seller" ? "Seller" : "Buyer"}
        </span>
        <span>
          Joined{" "}
          {new Date(profile.created_at).toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {profile.bio && (
        <div className="mb-8">
          <p className="text-sm leading-relaxed text-[var(--cream-muted)]">{profile.bio}</p>
        </div>
      )}

      <section className="mb-10">
        <h2 className="section-heading mb-4">Products</h2>
        {listings.length === 0 ? (
          <div className="card-organic px-6 py-10 text-center">
            <p className="text-sm text-[var(--cream-muted)]">No active listings right now.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((listing) => (
              <div key={listing.id} className="card-organic p-5" style={{ borderColor: accent ? `${accent}40` : undefined }}>
                <h3 className="font-semibold text-[var(--cream)]">{listing.name}</h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-medium" style={{ color: accent || "var(--green-pale)" }}>
                    ${(listing.price_cents / 100).toFixed(2)}
                    {listing.unit && <span className="text-[var(--cream-muted)]"> / {listing.unit}</span>}
                  </span>
                  <span className="text-[var(--cream-muted)]">{listing.qty_available} available</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-heading mb-4">Recent market appearances</h2>
        {!sessions || sessions.length === 0 ? (
          <div className="card-organic px-6 py-10 text-center">
            <p className="text-sm text-[var(--cream-muted)]">No market appearances yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session: any) => {
              const md = session.market_days;
              const mkt = md?.markets;
              const dateStr = md?.date
                ? new Date(md.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
                : "Unknown date";
              return (
                <div key={session.id} className="card-organic flex items-center justify-between px-4 py-3">
                  <div>
                    {mkt ? (
                      <Link href={`/markets/${mkt.id}`} className="link-button text-sm">
                        {mkt.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-[var(--cream)]">Unknown market</span>
                    )}
                    <p className="text-xs text-[var(--cream-muted)]">
                      {dateStr}
                      {session.stall_number && ` · Stall ${session.stall_number}`}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: md?.status === "OPEN" ? "var(--green-pale)" : md?.status === "CLOSED" ? "#c95a5a" : "var(--cream-muted)" }}
                  >
                    {md?.status ?? "PLANNED"}
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
