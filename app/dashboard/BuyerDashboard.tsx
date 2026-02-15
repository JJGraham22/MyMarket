"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

interface Order {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
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
  const [loading, setLoading] = useState(true);
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
      <header className="space-y-3">
        <h1 className="page-heading">Hey, {greeting}!</h1>
        <p className="page-subheading">
          Discover local markets, browse fresh produce, and track your orders.
        </p>
      </header>

      <section className="rounded-xl border-2 border-[var(--green-soft)]/40 bg-[var(--green-bg)]/30 p-5">
        <p className="text-sm text-[var(--cream)]">
          Do you sell at markets? Switch to a seller account to add your products and use Seller Checkout.
        </p>
        <button
          type="button"
          onClick={switchToSeller}
          disabled={switchingToSeller}
          className="btn-primary mt-4"
        >
          {switchingToSeller ? "Switching…" : "Switch to seller account"}
        </button>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/markets"
          className="card-organic card-btn flex flex-col justify-between p-6"
        >
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-xl" style={{ background: "var(--green-bg)" }}>
              🏪
            </div>
            <h2 className="section-heading text-[var(--cream)]">
              Find markets
            </h2>
            <p className="mt-2 text-sm text-[var(--cream-muted)]">
              Browse local farmers markets near you.
            </p>
          </div>
          <span className="card-btn-cta">
            Explore markets &rarr;
          </span>
        </Link>
        <div className="card-organic flex flex-col justify-between p-6 opacity-90">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-xl" style={{ background: "var(--brown-bg)" }}>
              📦
            </div>
            <h2 className="section-heading">My orders</h2>
            <p className="mt-2 text-sm text-[var(--cream-muted)]">
              See your order history below.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-heading mb-4">My orders</h2>
        {loading ? (
          <p className="text-sm text-[var(--cream-muted)]">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="card-organic px-6 py-10 text-center">
            <p className="text-sm text-[var(--cream-muted)]">
              You haven&apos;t placed any orders yet. Head to{" "}
              <Link href="/markets" className="link-button">
                Markets
              </Link>{" "}
              to get started.
            </p>
          </div>
        ) : (
          <div className="card-organic overflow-hidden p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wider text-[var(--cream-muted)]" style={{ borderColor: "rgba(168,137,104,0.2)", background: "var(--brown-bg)" }}>
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
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isGood = status === "PAID" || status === "COMPLETED";
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-medium"
      style={isGood ? { background: "var(--green-bg)", color: "var(--green-pale)", border: "1px solid rgba(107,158,58,0.3)" } : { background: "var(--brown-bg)", color: "var(--cream-muted)" }}
    >
      {status.replace("_", " ")}
    </span>
  );
}
