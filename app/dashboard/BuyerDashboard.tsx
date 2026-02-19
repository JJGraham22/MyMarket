"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { Badge } from "@/app/components/ui";

interface Order {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
}

interface SavedMarket {
  market_id: string;
  markets: { id: string; name: string; city: string | null; suburb: string | null } | null;
}

interface SavedSeller {
  seller_id: string;
  profiles: { id: string; display_name: string | null } | null;
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "PAID" || status === "COMPLETED" ? "success" : "neutral";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}

export function BuyerDashboard({ displayName, userId }: { displayName: string | null; userId: string }) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedMarkets, setSavedMarkets] = useState<SavedMarket[]>([]);
  const [savedSellers, setSavedSellers] = useState<SavedSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);
  const [switchingToSeller, setSwitchingToSeller] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase
        .from("orders").select("id, status, total_cents, created_at")
        .eq("customer_id", userId).order("created_at", { ascending: false }).limit(10);
      setOrders(data ?? []);
      setLoading(false);
    }
    fetchOrders();
  }, [userId]);

  useEffect(() => {
    async function fetchSaved() {
      const supabase = createBrowserSupabaseClient();
      const [marketsRes, sellersRes] = await Promise.all([
        supabase.from("saved_markets").select("market_id, markets(id, name, city, suburb)").eq("user_id", userId),
        supabase.from("saved_sellers").select("seller_id, profiles(id, display_name)").eq("user_id", userId),
      ]);
      setSavedMarkets((marketsRes.data ?? []) as unknown as SavedMarket[]);
      setSavedSellers((sellersRes.data ?? []) as unknown as SavedSeller[]);
      setSavedLoading(false);
    }
    fetchSaved();
  }, [userId]);

  async function switchToSeller() {
    setSwitchingToSeller(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("profiles").update({ role: "seller" }).eq("id", userId);
    setSwitchingToSeller(false);
    if (!error) router.refresh();
  }

  const greeting = displayName ?? "there";

  return (
    <div style={{ background: "var(--cream-page)", minHeight: "100vh", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, color: "#1a1a12", margin: "0 0 0.375rem", letterSpacing: "-0.02em" }}>
            Hey, {greeting}! 👋
          </h1>
          <p style={{ color: "var(--cream-muted)", fontSize: "1rem", margin: 0 }}>
            Discover local markets, browse fresh produce, and track your orders.
          </p>
        </div>

        {/* Switch to seller banner */}
        <div style={{
          background: "var(--forest)", borderRadius: "1rem", padding: "1.5rem",
          marginBottom: "2rem", display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between", gap: "1rem",
        }}>
          <div>
            <p style={{ color: "#fff", fontWeight: 600, margin: "0 0 0.25rem" }}>Sell at markets?</p>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", margin: 0 }}>
              Switch to a seller account to manage listings and accept payments.
            </p>
          </div>
          <button
            type="button"
            onClick={switchToSeller}
            disabled={switchingToSeller}
            style={{
              padding: "0.65rem 1.5rem", borderRadius: 9999,
              background: "#fff", color: "var(--forest)",
              fontWeight: 700, fontSize: "0.9rem", fontFamily: "'DM Sans', sans-serif",
              border: "none", cursor: "pointer",
              opacity: switchingToSeller ? 0.6 : 1,
            }}
          >
            {switchingToSeller ? "Switching…" : "Switch to Seller →"}
          </button>
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
          {[
            { href: "/markets", icon: "🏪", title: "Find Markets",  desc: "Browse farmers markets near you.", cta: "Explore →" },
            { href: "/orders",  icon: "📦", title: "My Orders",     desc: "View your order history.",          cta: "View orders →" },
            { href: "/search",  icon: "🔍", title: "Search",        desc: "Search markets and sellers.",       cta: "Search →" },
          ].map(({ href, icon, title, desc, cta }) => (
            <Link
              key={href}
              href={href}
              style={{
                background: "var(--cream-card)", borderRadius: "1rem",
                border: "1px solid rgba(26,66,49,0.08)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                padding: "1.5rem", textDecoration: "none",
                display: "block", transition: "transform 0.15s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(26,66,49,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }}
            >
              <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{icon}</div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.125rem", color: "#1a1a12", margin: "0 0 0.375rem" }}>{title}</h3>
              <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem", margin: "0 0 1rem", lineHeight: 1.5 }}>{desc}</p>
              <span style={{ color: "var(--forest)", fontWeight: 600, fontSize: "0.875rem" }}>{cta}</span>
            </Link>
          ))}
        </div>

        {/* Saved + Orders */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>

          {/* Saved Markets */}
          <div style={{ background: "var(--cream-card)", borderRadius: "1rem", border: "1px solid rgba(26,66,49,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: "1.5rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.125rem", color: "#1a1a12", margin: "0 0 1rem" }}>Saved Markets</h2>
            {savedLoading ? (
              <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>Loading…</p>
            ) : savedMarkets.length === 0 ? (
              <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>No saved markets yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {savedMarkets.map(sm => {
                  const m = sm.markets;
                  const id = m?.id ?? sm.market_id;
                  const name = m?.name ?? "Market";
                  const loc = [m?.suburb, m?.city].filter(Boolean).join(", ");
                  return (
                    <li key={sm.market_id}>
                      <Link href={"/markets/" + id} style={{
                        display: "block", padding: "0.625rem 0.875rem", borderRadius: "0.625rem",
                        background: "rgba(74,155,107,0.06)", border: "1px solid rgba(74,155,107,0.12)",
                        transition: "background 0.15s",
                      }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1a1a12" }}>{name}</span>
                        {loc && <span style={{ marginLeft: "0.5rem", color: "var(--cream-muted)", fontSize: "0.8125rem" }}>· {loc}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Saved Sellers */}
          <div style={{ background: "var(--cream-card)", borderRadius: "1rem", border: "1px solid rgba(26,66,49,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: "1.5rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.125rem", color: "#1a1a12", margin: "0 0 1rem" }}>Saved Sellers</h2>
            {savedLoading ? (
              <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>Loading…</p>
            ) : savedSellers.length === 0 ? (
              <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>No saved sellers yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {savedSellers.map(ss => {
                  const p = ss.profiles;
                  const id = p?.id ?? ss.seller_id;
                  const name = p?.display_name ?? "Seller";
                  return (
                    <li key={ss.seller_id}>
                      <Link href={"/sellers/" + id} style={{
                        display: "block", padding: "0.625rem 0.875rem", borderRadius: "0.625rem",
                        background: "rgba(74,155,107,0.06)", border: "1px solid rgba(74,155,107,0.12)",
                        transition: "background 0.15s",
                      }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1a1a12" }}>{name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div style={{ background: "var(--cream-card)", borderRadius: "1rem", border: "1px solid rgba(26,66,49,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: "1.5rem", marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.125rem", color: "#1a1a12", margin: 0 }}>Recent Orders</h2>
            <Link href="/orders" style={{ color: "var(--forest)", fontWeight: 600, fontSize: "0.875rem" }}>View all →</Link>
          </div>
          {loading ? (
            <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>Loading…</p>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <p style={{ color: "var(--cream-muted)", margin: "0 0 1rem" }}>No orders yet.</p>
              <Link href="/markets" className="btn-primary" style={{ display: "inline-flex" }}>Browse markets</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(26,66,49,0.08)" }}>
                    {["Order", "Status", "Total", "Date"].map(h => (
                      <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: h === "Total" || h === "Date" ? "right" : "left", color: "var(--forest)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: "1px solid rgba(26,66,49,0.06)" }}>
                      <td style={{ padding: "0.75rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#2a2218" }}>{order.id.slice(0,8)}…</td>
                      <td style={{ padding: "0.75rem" }}><StatusBadge status={order.status} /></td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, color: "#1a1a12" }}>${(order.total_cents / 100).toFixed(2)}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", color: "var(--cream-muted)" }}>{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
