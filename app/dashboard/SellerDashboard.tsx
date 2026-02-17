"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { PageHeader, Card, CardCTA, EmptyState, Badge, Button, Skeleton } from "@/app/components/ui";
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
      <PageHeader
        title={`Welcome back, ${greeting}`}
        subtitle="Manage your market stall, inventory, and orders."
      />

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/seller/checkout" className="flex flex-col">
          <Card variant="clickable" padding="md" className="flex flex-1 flex-col justify-between">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-xl bg-[var(--green-bg)]">
                🛒
              </div>
              <h2 className="section-heading text-[var(--cream)]">Seller Checkout</h2>
              <p className="mt-2 text-sm text-[var(--cream-muted)]">
                Ring up customers, manage inventory, and create orders.
              </p>
            </div>
            <CardCTA>Go to checkout &rarr;</CardCTA>
          </Card>
        </Link>
        <Link href="/seller/inventory" className="flex flex-col">
          <Card variant="clickable" padding="md" className="flex flex-1 flex-col justify-between">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-xl bg-[var(--green-bg)]">
                📦
              </div>
              <h2 className="section-heading text-[var(--cream)]">Inventory</h2>
              <p className="mt-2 text-sm text-[var(--cream-muted)]">
                Manage listings by market day: add items, set prices, and stock levels.
              </p>
            </div>
            <CardCTA>Manage inventory &rarr;</CardCTA>
          </Card>
        </Link>
        <Card padding="md" className="flex flex-col justify-between opacity-90">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-xl bg-[var(--brown-bg)]">
              ☀️
            </div>
            <h2 className="section-heading">Start a Market Day</h2>
            <p className="mt-2 text-sm text-[var(--cream-muted)]">
              Set up your stall and add listings. Coming soon.
            </p>
          </div>
        </Card>
      </section>

      <section id="my-products">
        <MyProducts userId={userId} />
      </section>

      <section>
        <h2 className="section-heading mb-4">Recent orders</h2>
        {loading ? (
          <Skeleton lines={3} />
        ) : orders.length === 0 ? (
          <EmptyState
            message={
              <>
                No orders yet. Head to{" "}
                <Link href="/seller/checkout" className="link-button">
                  Seller Checkout
                </Link>{" "}
                to create your first order.
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

      <ProfileSettingsSection userId={userId} />
    </div>
  );
}

function ProfileSettingsSection({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        className="section-heading mb-3 w-full justify-start rounded-lg border-2 border-[var(--brown-soft)]/40 bg-[var(--brown-bg)]/50 px-4 py-3"
      >
        <span className={"inline-block transition-transform " + (open ? "rotate-90" : "")}>
          &#9654;
        </span>
        Profile &amp; storefront
      </Button>
      {open && (
        <Card padding="md">
          <ProfileSettings userId={userId} />
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "PAID" || status === "COMPLETED" ? "success" : "neutral";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}
