import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { PayNowButton } from "./PayNowButton";

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  expires_at: string | null;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
    listings: {
      name: string;
      unit: string | null;
    } | null;
  }[];
};

export default async function PayOrderPage({
  params
}: {
  params: { orderId: string };
}) {
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, total_cents, expires_at, created_at, order_items(id, quantity, unit_price_cents, line_total_cents, listings(name, unit))"
    )
    .eq("id", params.orderId)
    .single();

  if (error || !data) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-50">Order not found</h1>
        <p className="text-sm text-slate-400">
          We could not find an order for this link. Please check with the seller and try scanning
          the QR code again.
        </p>
      </main>
    );
  }

  const order = data as unknown as OrderRow;
  const now = new Date();
  const expiresAt = order.expires_at ? new Date(order.expires_at) : null;
  const isExpired =
    order.status === "EXPIRED" || (expiresAt !== null && expiresAt.getTime() < now.getTime());

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
          My Market · Pay by phone
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Order payment link
        </h1>
        <p className="max-w-xl text-sm text-slate-400">
          Review the items in your order and confirm payment with the seller at their stall. This
          link is private to you and may expire shortly after creation.
        </p>
      </header>

      <section className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">
              Order ID: <span className="font-mono text-[0.7rem] text-slate-200">{order.id}</span>
            </p>
            <p className="mt-1 text-xs">
              Status:{" "}
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                  isExpired
                    ? "bg-red-500/20 text-red-200"
                    : order.status === "PAID"
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-amber-500/20 text-amber-100"
                }`}
              >
                {isExpired ? "EXPIRED" : order.status}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total due</p>
            <p className="text-2xl font-semibold text-emerald-300">
              ${(order.total_cents / 100).toFixed(2)}
            </p>
            {expiresAt && (
              <p className="mt-1 text-[0.7rem] text-slate-400">
                Expires at:{" "}
                <span className="font-mono">
                  {expiresAt.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="max-h-72 overflow-auto rounded-lg border border-slate-800/80 bg-slate-950/50">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Item</th>
                <th className="px-3 py-2 text-left font-medium">Unit</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Price</th>
                <th className="px-3 py-2 text-right font-medium">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-800/70 hover:bg-slate-900/60"
                >
                  <td className="px-3 py-2 text-xs sm:text-sm">
                    {item.listings?.name ?? "Item"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {item.listings?.unit ?? "each"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs sm:text-sm">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 text-right text-xs sm:text-sm">
                    ${(item.unit_price_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs sm:text-sm">
                    ${(item.line_total_cents / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isExpired && (
          <p className="text-xs text-red-200">
            This order has expired. Please ask the seller to create a new QR link and scan the
            updated code.
          </p>
        )}

        {!isExpired && order.status === "PENDING_PAYMENT" && (
          <div className="space-y-3">
            <PayNowButton
              orderId={order.id}
              disabled={false}
            />
            <p className="text-[0.7rem] text-slate-400">
              You&apos;ll be redirected to a secure Stripe checkout page to complete payment.
            </p>
          </div>
        )}

        {order.status === "PAID" && (
          <p className="text-xs text-emerald-200">
            This order is marked as paid. Thank you for supporting your local farmers.
          </p>
        )}

        {!isExpired && order.status !== "PENDING_PAYMENT" && order.status !== "PAID" && (
          <PayNowButton
            orderId={order.id}
            disabled={true}
          />
        )}
      </section>
    </main>
  );
}

