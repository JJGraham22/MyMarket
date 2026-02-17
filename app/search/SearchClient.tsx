"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, EmptyState } from "@/app/components/ui";

interface Market {
  id: string;
  name: string;
  city: string | null;
  suburb: string | null;
  address: string | null;
}

interface Seller {
  id: string;
  display_name: string | null;
  tagline: string | null;
  logo_url: string | null;
}

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the search bar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async () => {
    if (!query.trim() && !location.trim()) {
      setMarkets([]);
      setSellers([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());

    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    setMarkets(data.markets ?? []);
    setSellers(data.sellers ?? []);
    setSearched(true);
    setLoading(false);
  }, [query, location]);

  // Debounced search on typing
  useEffect(() => {
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [doSearch]);

  const totalResults = markets.length + sellers.length;

  return (
    <div className="space-y-14">
      <PageHeader
        title="Find markets &amp; sellers"
        subtitle="Search by name, suburb, product, or keyword."
        className="text-center"
      />

      <Card padding="lg" className="p-6 sm:p-8">
        <div className="space-y-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-60 text-[var(--cream-muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-[3.5px] w-[3.5px]">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search markets, sellers, products…"
              className="input w-full py-4 pl-6 pr-4 text-base"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-60 text-[var(--cream-muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-[3px] w-[3px]">
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Filter by city (e.g. Sydney, Brisbane)…"
              className="input flex-1"
            />
          </div>
        </div>
      </Card>

      {loading && (
        <p className="text-center text-sm text-[var(--cream-muted)]">Searching…</p>
      )}

      {!loading && searched && totalResults === 0 && (
        <EmptyState message="No results found. Try a different search term." />
      )}

      {!loading && markets.length > 0 && (
        <section>
          <h2 className="section-heading mb-4">
            Markets <span className="text-sm font-normal text-[var(--cream-muted)]">({markets.length})</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {markets.map((market) => (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="card-organic group flex flex-col p-6 transition-colors hover:border-[var(--green-soft)]/30"
              >
                <h3 className="font-semibold text-[var(--cream)] group-hover:text-[var(--green-pale)]">{market.name}</h3>
                {(market.suburb || market.city) && (
                  <p className="mt-1 text-sm text-[var(--cream-muted)]">{[market.suburb, market.city].filter(Boolean).join(", ")}</p>
                )}
                {market.address && <p className="mt-1 text-xs text-[var(--cream-muted)] opacity-80">{market.address}</p>}
                <span className="mt-4 text-sm font-medium" style={{ color: "var(--green-pale)" }}>View details &rarr;</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && sellers.length > 0 && (
        <section>
          <h2 className="section-heading mb-4">
            Sellers <span className="text-sm font-normal text-[var(--cream-muted)]">({sellers.length})</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {sellers.map((seller) => {
              const name = seller.display_name ?? "Unknown Seller";
              const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <Link
                  key={seller.id}
                  href={`/sellers/${seller.id}`}
                  className="card-organic group flex items-start gap-4 p-6 transition-colors hover:border-[var(--green-soft)]/30"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ background: "var(--green-bg)" }}>
                    {seller.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={seller.logo_url} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: "var(--green-pale)" }}>{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-[var(--cream)] group-hover:text-[var(--green-pale)]">{name}</h3>
                    {seller.tagline && <p className="mt-0.5 truncate text-sm text-[var(--cream-muted)]">{seller.tagline}</p>}
                    <span className="mt-2 block text-sm font-medium" style={{ color: "var(--green-pale)" }}>View profile &rarr;</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
