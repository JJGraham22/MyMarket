"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, Card, Input, Select, EmptyState, Skeleton } from "@/app/components/ui";

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
    if (search) params.set("search", search);
    if (city) params.set("city", city);
    if (openToday) params.set("openToday", "true");

    const res = await fetch(`/api/markets?${params.toString()}`);
    const data = await res.json();
    setMarkets(data.markets ?? []);
    setLoading(false);
  }, [search, city, openToday]);

  // Fetch all cities once on mount for the dropdown
  useEffect(() => {
    async function loadCities() {
      const res = await fetch("/api/markets");
      const data = await res.json();
      const allMarkets: Market[] = data.markets ?? [];
      const uniqueCities = Array.from(
        new Set(
          allMarkets
            .map((m) => m.city)
            .filter((c): c is string => Boolean(c))
        )
      ).sort();
      setCities(uniqueCities);
    }
    loadCities();
  }, []);

  // Fetch markets whenever filters change
  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const cityOptions = cities.map((c) => ({ value: c, label: c }));

  return (
    <div className="space-y-12">
      <PageHeader
        title="Browse markets"
        subtitle="Find local farmers markets near you."
      />

      <Card padding="md">
        <h2 className="section-heading mb-4">Filter</h2>
        <div className="flex flex-wrap items-end gap-4">
          <Input
            id="search"
            label="Search"
            type="text"
            placeholder="Market name or suburb…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1"
          />
          <Select
            id="city"
            label="City"
            placeholder="All cities"
            options={cityOptions}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="min-w-[140px]"
          />
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={openToday}
              onChange={(e) => setOpenToday(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--brown-soft)] bg-[var(--ground-elevated)] text-[var(--green-mid)]"
            />
            <span className="text-sm text-[var(--cream-muted)]">Open today</span>
          </label>
        </div>
      </Card>

      <section>
        <h2 className="section-heading mb-4">Results</h2>
        {loading ? (
          <Skeleton lines={4} className="py-8" />
        ) : markets.length === 0 ? (
          <EmptyState message="No markets found. Try adjusting your filters." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {markets.map((market) => (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="card-organic group flex flex-col p-6 transition-colors hover:border-[var(--green-soft)]/30"
              >
                <h3 className="font-semibold text-[var(--cream)] group-hover:text-[var(--green-pale)]">
                  {market.name}
                </h3>
                {(market.suburb || market.city) && (
                  <p className="mt-1 text-sm text-[var(--cream-muted)]">
                    {[market.suburb, market.city].filter(Boolean).join(", ")}
                  </p>
                )}
                {market.address && (
                  <p className="mt-1 text-xs text-[var(--cream-muted)] opacity-80">
                    {market.address}
                  </p>
                )}
                <span className="mt-4 text-sm font-medium text-[var(--green-pale)]">
                  View details &rarr;
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
