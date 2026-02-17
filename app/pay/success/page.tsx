import { createServiceRoleSupabaseClient } from "@/lib/supabaseClient";
import { OrderStatusPoller } from "./OrderStatusPoller";
import Link from "next/link";

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  paid_at: string | null;
};

export default async function PaySuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const orderId = searchParams.orderId;

  if (!orderId) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-50">Payment received</h1>
        <p className="text-sm text-slate-400">
          Thank you for your purchase! You can close this page.
        </p>
      </main>
    );
  }

  // Load the order so we can show initial state and pass to the poller
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, total_cents, paid_at")
    .eq("id", orderId)
    .single();

  const order = data as unknown as OrderRow | null;

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
          My Market · Payment
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Payment confirmation
        </h1>
        <p className="max-w-xl text-sm text-slate-400">
          Your payment has been submitted. The seller will be notified and your
          items are reserved for pickup.
        </p>
      </header>

      <section className="card p-5 space-y-4">
        {order ? (
          <OrderStatusPoller
            orderId={order.id}
            initialStatus={order.status}
            totalCents={order.total_cents}
          />
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-lg text-emerald-300">
              &#10003;
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-50">Payment submitted</p>
              <p className="text-xs text-slate-400">
                Order{" "}
                <span className="font-mono text-[0.7rem] text-slate-200">{orderId}</span>
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400">
          The order status will update to <strong style={{ color: "var(--green-pale)" }}>PAID</strong> once
          the payment is fully processed (usually a few seconds). You can safely close this page.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href={`/pay/${orderId}`} className="link-button text-sm">
            View order details
          </Link>
          <Link href="/" className="btn-secondary text-sm">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
