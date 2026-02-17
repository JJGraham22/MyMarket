"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { PageHeader, Card, CardCTA, EmptyState, Badge, Button, Skeleton } from "@/app/components/ui";

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

export function BuyerDashboard({
  displayName,
  userId,
}: {
  displayName: string | null;
  userId: string;
}) {
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
        .from("orders")
        .select("id, status, total_cents, created_at")
        .eq("customer_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      setOrders(data ?? []);
      setLoading(false);
    }

    fetchOrders();
  }, [userId]);

  useEffect(() => {
    async function fetchSaved() {
      const supabase = createBrowserSupabaseClient();
      const [marketsRes, sellersRes] = await Promise.all([
        supabase
          .from("saved_markets")
          .select("market_id, markets(id, name, city, suburb)")
          .eq("user_id", userId),
        supabase
          .from("saved_sellers")
          .select("seller_id, profiles(id, display_name)")
          .eq("user_id", userId),
      ]);
      setSavedMarkets((marketsRes.data ?? []) as SavedMarket[]);
      setSavedSellers((sellersRes.data ?? []) as SavedSeller[]);
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

  const greeting = displayName ? displayName : "there";

  return (
    <div className="space-y-14">
      <PageHeader
        title={`Hey, ${greeting}!`}
        subtitle="Discover local markets, browse fresh produce, and track your orders."
      />

      <Card padding="md" className="border-2 border-[var(--green-soft)]/40 bg-[var(--green-bg)]/30">
        <p className="text-sm text-[var(--cream)]">
          Do you sell at markets? Switch to a seller account to add your products and use Seller Checkout.
        </p>
        <Button
          type="button"
          onClick={switchToSeller}
          disabled={switchingToSeller}
          className="mt-4"
        >
          {switchingToSeller ? "Switching…" : "Switch to seller account"}
        </Button>
      </Card>

      <section className="grid gap-6 sm:grid-cols-2">
        <Link href="/markets" className="flex flex-col">
          <Card variant="clickable" padding="md" className="flex flex-1 flex-col justify-between">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-xl bg-[var(--green-bg)]">
                🏪
              </div>
              <h2 className="section-heading text-[var(--cream)]">Find markets</h2>
              <p className="mt-2 text-sm text-[var(--cream-muted)]">
                Browse local farmers markets near you.
              </p>
            </div>
            <CardCTA>Explore markets &rarr;</CardCTA>
          </Card>
        </Link>
        <Link href="/orders" className="flex flex-col">
          <Card variant="clickable" padding="md" className="flex flex-1 flex-col justify-between">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-xl bg-[var(--brown-bg)]">
                📦
              </div>
              <h2 className="section-heading text-[var(--cream)]">My orders</h2>
              <p className="mt-2 text-sm text-[var(--cream-muted)]">
                See your order history and status.
              </p>
            </div>
            <CardCTA>View orders &rarr;</CardCTA>
          </Card>
        </Link>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="section-heading mb-4">Saved markets</h2>
          {savedLoading ? (
            <Skeleton lines={3} />
          ) : savedMarkets.length === 0 ? (
            <p className="text-sm text-[var(--cream-muted)]">No saved markets yet. Save markets from their pages to see them here.</p>
          ) : (
              <ul className="space-y-2">
                {savedMarkets.map((sm) => {
                  const m = sm.markets;
                  const id = m?.id ?? sm.market_id;
                  const name = m?.name ?? "Market";
                  const loc = [m?.suburb, m?.city].filter(Boolean).join(", ");
                  return (
                    <li key={sm.market_id}>
                      <Link
                        href={"/markets/" + id}
                        className="block rounded-lg border border-[var(--brown-soft)]/30 bg-[var(--brown-bg)]/30 px-4 py-3 text-sm transition-colors hover:border-[var(--green-soft)]/40 hover:bg-[var(--green-bg)]/20"
                      >
                        <span className="font-medium text-[var(--cream)]">{name}</span>
                        {loc && <span className="ml-2 text-[var(--cream-muted)]">· {loc}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
          )}
        </div>
        <div>
          <h2 className="section-heading mb-4">Saved sellers</h2>
          {savedLoading ? (
            <Skeleton lines={3} />
          ) : savedSellers.length === 0 ? (
            <p className="text-sm text-[var(--cream-muted)]">No saved sellers yet. Save sellers from their profiles to see them here.</p>
          ) : (
              <ul className="space-y-2">
                {savedSellers.map((ss) => {
                  const p = ss.profiles;
                  const id = p?.id ?? ss.seller_id;
                  const name = p?.display_name ?? "Seller";
                  return (
                    <li key={ss.seller_id}>
                      <Link
                        href={"/sellers/" + id}
                        className="block rounded-lg border border-[var(--brown-soft)]/30 bg-[var(--brown-bg)]/30 px-4 py-3 text-sm transition-colors hover:border-[var(--green-soft)]/40 hover:bg-[var(--green-bg)]/20"
                      >
                        <span className="font-medium text-[var(--cream)]">{name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="section-heading mb-4">My orders</h2>
        {loading ? (
          <Skeleton lines={3} />
        ) : orders.length === 0 ? (
          <EmptyState
            message={
              <>
                You haven&apos;t placed any orders yet. Head to{" "}
                <Link href="/markets" className="link-button">
                  Markets
                </Link>{" "}
                to get started.
              </>
            }
          />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(168,137,104,0.15)]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--brown-bg)]/50">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--cream)]">{order.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-right text-[var(--cream)]">${(order.total_cents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-xs text-[var(--cream-muted)]">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "PAID" || status === "COMPLETED" ? "success" : "neutral";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}
