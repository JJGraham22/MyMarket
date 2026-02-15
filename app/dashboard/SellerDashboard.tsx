"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { ProfileSettings } from "./ProfileSettings";
import { MyProducts } from "./MyProducts";

interface Order {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
}

export function SellerDashboard({
  displayName,
  userId,
}: {
  displayName: string | null;
  userId: string;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const supabase = createBrowserSupabaseClient();

      // Get seller_session ids for this user, then recent orders
      const { data: sessions } = await supabase
        .from("seller_sessions")
        .select("id")
        .eq("seller_id", userId);

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s: { id: string }) => s.id);
        const { data } = await supabase
          .from("orders")
          .select("id, status, total_cents, created_at")
          .in("seller_session_id", sessionIds)
          .order("created_at", { ascending: false })
          .limit(10);

        setOrders(data ?? []);
      }

      setLoading(false);
    }

    fetchOrders();
  }, [userId]);

  const greeting = displayName ? displayName : "Seller";

  return (
    <div className="space-y-14">
      <header className="space-y-3">
        <h1 className="page-heading">Welcome back, {greeting}</h1>
        <p className="page-subheading">
          Manage your market stall, inventory, and orders.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/seller/checkout"
          className="card-organic card-btn flex flex-col justify-between p-6"
        >
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-xl" style={{ background: "var(--green-bg)" }}>
              🛒
            </div>
            <h2 className="section-heading text-[var(--cream)]">
              Seller Checkout
            </h2>
            <p className="mt-2 text-sm text-[var(--cream-muted)]">
              Ring up customers, manage inventory, and create orders.
            </p>
          </div>
          <span className="card-btn-cta">
            Go to checkout &rarr;
          </span>
        </Link>
        <Link
          href="#my-products"
          className="card-organic card-btn flex flex-col justify-between p-6"
        >
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-xl" style={{ background: "var(--green-bg)" }}>
              📦
            </div>
            <h2 className="section-heading text-[var(--cream)]">
              My products
            </h2>
            <p className="mt-2 text-sm text-[var(--cream-muted)]">
              Add new items, set prices, and remove products from your stall.
            </p>
          </div>
          <span className="card-btn-cta">
            Add or edit products &rarr;
          </span>
        </Link>
        <div className="card-organic flex flex-col justify-between p-6 opacity-90">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-xl" style={{ background: "var(--brown-bg)" }}>
              ☀️
            </div>
            <h2 className="section-heading">Start a Market Day</h2>
            <p className="mt-2 text-sm text-[var(--cream-muted)]">
              Set up your stall and add listings. Coming soon.
            </p>
          </div>
        </div>
      </section>

      <section id="my-products">
        <MyProducts userId={userId} />
      </section>

      <section>
        <h2 className="section-heading mb-4">Recent orders</h2>
        {loading ? (
          <p className="text-sm text-[var(--cream-muted)]">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="card-organic px-6 py-10 text-center">
            <p className="text-sm text-[var(--cream-muted)]">
              No orders yet. Head to{" "}
              <Link href="/seller/checkout" className="link-button">
                Seller Checkout
              </Link>{" "}
              to create your first order.
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

      <ProfileSettingsSection userId={userId} />
    </div>
  );
}

function ProfileSettingsSection({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="section-heading mb-3 flex w-full items-center gap-2 rounded-lg border-2 border-[var(--brown-soft)]/40 bg-[var(--brown-bg)]/50 px-4 py-3 text-left transition-colors hover:border-[var(--green-soft)]/50 hover:bg-[var(--green-bg)]/30"
      >
        <span className="inline-block transition-transform" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
          &#9654;
        </span>
        Profile &amp; storefront
      </button>
      {open && (
        <div className="card-organic p-6">
          <ProfileSettings userId={userId} />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isGood = status === "PAID" || status === "COMPLETED";
  return (
    <span
      className="badge-soft inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-medium"
      style={isGood ? { background: "var(--green-bg)", color: "var(--green-pale)", border: "1px solid rgba(107,158,58,0.3)" } : undefined}
    >
      {status.replace("_", " ")}
    </span>
  );
}
