"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Market {
  id: string;
  name: string;
  city: string | null;
  suburb: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export function MarketsClient() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [openToday, setOpenToday] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)    params.set("search", search);
    if (city)      params.set("city", city);
    if (openToday) params.set("openToday", "true");
    const res = await fetch(`/api/markets?${params.toString()}`);
    const data = await res.json();
    setMarkets(data.markets ?? []);
    setLoading(false);
  }, [search, city, openToday]);

  useEffect(() => {
    async function loadCities() {
      const res = await fetch("/api/markets");
      const data = await res.json();
      const all: Market[] = data.markets ?? [];
      const unique = Array.from(new Set(all.map(m => m.city).filter((c): c is string => Boolean(c)))).sort();
      setCities(unique);
    }
    loadCities();
  }, []);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  return (
    <div style={{ background: "var(--cream-page)", minHeight: "100vh", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ color: "var(--forest)", fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.5rem", margin: "0 0 0.5rem" }}>
            Discover
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 700, color: "#1a1a12", margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            Browse Markets
          </h1>
          <p style={{ color: "var(--cream-muted)", fontSize: "1rem", margin: 0 }}>
            Find local farmers markets and fresh produce near you.
          </p>
        </div>

        {/* Filters */}
        <div style={{
          background: "var(--cream-card)", borderRadius: "1rem",
          border: "1px solid rgba(26,66,49,0.08)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          padding: "1.25rem 1.5rem", marginBottom: "2rem",
          display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end",
        }}>
          <div style={{ flex: "1", minWidth: 200 }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--forest)", marginBottom: "0.4rem" }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Market name or suburb…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ minWidth: 140 }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--forest)", marginBottom: "0.4rem" }}>
              City
            </label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="input"
            >
              <option value="">All cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", paddingBottom: "0.65rem" }}>
            <input
              type="checkbox"
              checked={openToday}
              onChange={e => setOpenToday(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--forest)" }}
            />
            <span style={{ fontSize: "0.875rem", color: "#2a2218", fontWeight: 500 }}>Open today</span>
          </label>
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: "var(--cream-card)", borderRadius: "1rem", height: 140, border: "1px solid rgba(26,66,49,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : markets.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "4rem 2rem",
            background: "var(--cream-card)", borderRadius: "1rem",
            border: "1px solid rgba(26,66,49,0.08)",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🌾</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1a1a12", margin: "0 0 0.5rem" }}>No markets found</h3>
            <p style={{ color: "var(--cream-muted)", margin: 0 }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              {markets.length} market{markets.length !== 1 ? "s" : ""} found
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {markets.map(market => (
                <Link
                  key={market.id}
                  href={`/markets/${market.id}`}
                  style={{
                    background: "var(--cream-card)",
                    borderRadius: "1rem",
                    border: "1px solid rgba(26,66,49,0.08)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    padding: "1.5rem",
                    display: "block",
                    transition: "transform 0.15s, box-shadow 0.2s, border-color 0.2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(26,66,49,0.1)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,155,107,0.4)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,66,49,0.08)";
                  }}
                >
                  {/* Placeholder image area */}
                  <div style={{
                    height: 100, borderRadius: "0.625rem", marginBottom: "1rem",
                    background: "linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "2rem",
                  }}>
                    🏪
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.125rem", color: "#1a1a12", margin: "0 0 0.375rem" }}>
                    {market.name}
                  </h3>
                  {(market.suburb || market.city) && (
                    <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem", margin: "0 0 1rem" }}>
                      📍 {[market.suburb, market.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <span style={{ color: "var(--forest)", fontWeight: 600, fontSize: "0.875rem" }}>
                    View stalls →
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
