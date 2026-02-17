import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Badge } from "@/app/components/ui";

interface OrderDetailProps {
  params: Promise<{ id: string }> | { id: string };
}

interface OrderItemRow {
  id: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  listings: { name: string; unit: string | null } | null;
}

interface OrderDetailRow {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
  customer_id: string | null;
  seller_session_id: string;
  order_items: OrderItemRow[];
  seller_sessions: {
    seller_id: string;
    market_days: {
      market_id: string;
      date: string;
      markets: { id: string; name: string } | null;
    } | null;
  } | null;
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "PAID" || status === "COMPLETED" ? "success" : status === "EXPIRED" || status === "CANCELLED" ? "error" : "neutral";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}

function formatDateTime(s: string) {
  return new Date(s).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateMetadata({ params }: OrderDetailProps) {
  const resolved = await Promise.resolve(params);
  return { title: `Order ${resolved.id.slice(0, 8)}… — My Market` };
}

export default async function OrderDetailPage({ params }: OrderDetailProps) {
  const resolved = await Promise.resolve(params);
  const orderId = resolved.id;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, status, total_cents, created_at, paid_at, expires_at, customer_id, seller_session_id, " +
        "order_items(id, quantity, unit_price_cents, line_total_cents, listings(name, unit)), " +
        "seller_sessions(seller_id, market_days(market_id, date, markets(id, name)))"
    )
    .eq("id", orderId)
    .single();

  if (orderError || !orderData) {
    notFound();
  }

  const order = orderData as unknown as OrderDetailRow;

  // Access check: buyer is customer, or seller owns the session
  const isCustomer = order.customer_id === user.id;
  if (!isCustomer) {
    const { data: sessions } = await supabase
      .from("seller_sessions")
      .select("id")
      .eq("seller_id", user.id);
    const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);
    if (!sessionIds.includes(order.seller_session_id)) {
      notFound();
    }
  }

  const session = order.seller_sessions;
  const marketDay = session?.market_days;
  const market = marketDay?.markets;
  const marketId = market?.id ?? marketDay?.market_id;
  const marketName = market?.name ?? "Market";
  const sellerId = session?.seller_id;
  const marketDate = marketDay?.date
    ? new Date(marketDay.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : null;

  const timeline = [
    { label: "Order placed", at: order.created_at, done: true },
    { label: "Paid", at: order.paid_at, done: !!order.paid_at },
    { label: "Completed", at: null, done: order.status === "COMPLETED" },
  ];

  return (
    <div className="space-y-10">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-sm text-[var(--cream-muted)] transition-colors hover:text-[var(--green-pale)]"
      >
        &larr; Back to orders
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">Order {order.id.slice(0, 8)}…</h1>
          <p className="mt-1 text-sm text-[var(--cream-muted)]">{formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      {/* Status timeline */}
      <section>
        <h2 className="section-heading mb-4">Status</h2>
        <div className="flex flex-wrap gap-4">
          {timeline.map((step, i) => (
            <div
              key={step.label}
              className="flex items-center gap-2 rounded-lg border border-[var(--brown-soft)]/30 bg-[var(--brown-bg)]/30 px-4 py-3"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium"
                style={
                  step.done
                    ? { background: "var(--green-bg)", color: "var(--green-pale)" }
                    : { background: "var(--brown-bg)", color: "var(--cream-muted)" }
                }
              >
                {step.done ? "✓" : i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--cream)]">{step.label}</p>
                {step.at && (
                  <p className="text-xs text-[var(--cream-muted)]">{formatDateTime(step.at)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Line items */}
      <section>
        <h2 className="section-heading mb-4">Items</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--brown-soft)]/30">
          <table className="w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(168,137,104,0.2)]">
              {order.order_items?.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--brown-bg)]/30">
                  <td className="px-4 py-3 text-[var(--cream)]">{item.listings?.name ?? "Item"}</td>
                  <td className="px-4 py-3 text-[var(--cream-muted)]">{item.listings?.unit ?? "each"}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">${(item.unit_price_cents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium">${(item.line_total_cents / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-right text-lg font-semibold text-[var(--cream)]">
          Total: ${(order.total_cents / 100).toFixed(2)}
        </p>
      </section>

      {/* Links to market and seller */}
      <section>
        <h2 className="section-heading mb-4">Where</h2>
        <div className="flex flex-wrap gap-4">
          {marketId && (
            <Link
              href={"/markets/" + marketId}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--green-soft)]/40 bg-[var(--green-bg)]/20 px-4 py-3 text-sm font-medium transition-colors hover:border-[var(--green-soft)]/60 hover:bg-[var(--green-bg)]/30"
              style={{ color: "var(--green-pale)" }}
            >
              {marketName}
              {marketDate && ` · ${marketDate}`}
              <span aria-hidden>→</span>
            </Link>
          )}
          {sellerId && (
            <Link
              href={"/sellers/" + sellerId}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--brown-soft)]/40 bg-[var(--brown-bg)]/30 px-4 py-3 text-sm font-medium text-[var(--cream)] transition-colors hover:bg-[var(--brown-bg)]/50"
            >
              View seller
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
