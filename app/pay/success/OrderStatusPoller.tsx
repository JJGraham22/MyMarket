"use client";

import { useEffect, useState } from "react";

type OrderStatus = {
  status: string;
  totalCents: number;
  paidAt: string | null;
};

export function OrderStatusPoller({
  orderId,
  initialStatus,
  totalCents,
}: {
  orderId: string;
  initialStatus: string;
  totalCents: number;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [polling, setPolling] = useState(initialStatus === "PENDING_PAYMENT");

  useEffect(() => {
    if (!polling) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8; // ~24 seconds with 3s interval (after initial fetch)
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function checkStatus() {
      if (cancelled) return;
      attempts++;
      try {
        const res = await fetch(`/api/orders/status?orderId=${orderId}`);
        if (res.ok) {
          const data: OrderStatus = await res.json();
          if (!cancelled) {
            setStatus(data.status);
            if (data.status !== "PENDING_PAYMENT") {
              setPolling(false);
              if (intervalId) clearInterval(intervalId);
              return;
            }
          }
        }
      } catch {
        // Network error — keep polling
      }
      if (attempts >= maxAttempts && !cancelled) {
        setPolling(false);
        if (intervalId) clearInterval(intervalId);
      }
    }

    // First check immediately (catches server-side sync from success page)
    void checkStatus();

    intervalId = setInterval(checkStatus, 3000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, polling]);

  if (status === "PAID" || status === "COMPLETED") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-lg text-emerald-300">
            &#10003;
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-50">Payment received</p>
            <p className="text-xs text-slate-400">
              Order{" "}
              <span className="font-mono text-[0.7rem] text-slate-200">{orderId}</span>
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total paid</span>
            <span className="text-lg font-semibold text-emerald-300">
              ${(totalCents / 100).toFixed(2)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-200">
              {status}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Still pending
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-lg text-amber-300 animate-pulse">
          &#8987;
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-50">
            {polling ? "Processing payment…" : "Waiting for confirmation"}
          </p>
          <p className="text-xs text-slate-400">
            Order{" "}
            <span className="font-mono text-[0.7rem] text-slate-200">{orderId}</span>
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Total</span>
          <span className="text-lg font-semibold text-emerald-300">
            ${(totalCents / 100).toFixed(2)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-400">Status</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-100">
            {status}
          </span>
        </div>
      </div>

      {!polling && status === "PENDING_PAYMENT" && (
        <p className="text-xs text-amber-100">
          Payment is still processing. Please wait a moment and refresh, or contact the seller.
        </p>
      )}
    </div>
  );
}
