"use client";

import { useState } from "react";
import { PayNowButton } from "./PayNowButton";

function getProviderName(provider: string | null): string {
  switch (provider) {
    case "square":
      return "Square";
    case "stripe":
      return "Stripe Connect";
    case "platform":
    default:
      return "Stripe";
  }
}

export function PaymentOptions({
  orderId,
  totalCents,
  paymentProvider,
  buyerInitiated = false,
  showCashPayment = false,
}: {
  orderId: string;
  totalCents: number;
  paymentProvider: string | null;
  buyerInitiated?: boolean;
  showCashPayment?: boolean;
}) {
  if (!orderId || typeof totalCents !== "number") {
    return (
      <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
        Invalid payment options data. Please refresh the page.
      </div>
    );
  }

  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [cashReceived, setCashReceived] = useState("");
  const [processingCash, setProcessingCash] = useState(false);
  const [cashError, setCashError] = useState<string | null>(null);

  const totalDollars = (totalCents ?? 0) / 100;
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const changeOwed = cashReceivedNum - totalDollars;
  const providerName = getProviderName(paymentProvider ?? null);

  async function handleCashPayment() {
    if (cashReceivedNum < totalDollars) {
      setCashError(`Amount received ($${cashReceivedNum.toFixed(2)}) is less than total ($${totalDollars.toFixed(2)}).`);
      return;
    }

    setProcessingCash(true);
    setCashError(null);

    try {
      const res = await fetch("/api/orders/pay-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          cashReceivedCents: Math.round(cashReceivedNum * 100),
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to process cash payment.");
      }

      // Reload page to show updated status
      window.location.reload();
    } catch (err: unknown) {
      setCashError((err as Error).message);
      setProcessingCash(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Payment method selector - only show if cash payment is available (seller checkout) */}
      {showCashPayment && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              paymentMethod === "card"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-600"
            }`}
          >
            Card Payment
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("cash")}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              paymentMethod === "cash"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-600"
            }`}
          >
            Cash Payment
          </button>
        </div>
      )}

      {/* Card payment option - always show for buyer-initiated/guest, or when card is selected for seller checkout */}
      {(buyerInitiated || !showCashPayment || paymentMethod === "card") && (
        <div className="space-y-3">
          <PayNowButton orderId={orderId} disabled={false} />
          <p className="text-[0.7rem] text-slate-400">
            {buyerInitiated 
              ? `You'll be redirected to a secure ${providerName} checkout page to complete your online payment.`
              : `You'll be redirected to a secure ${providerName} checkout page to complete payment.`
            }
          </p>
        </div>
      )}

      {/* Cash payment option - only for seller checkout */}
      {showCashPayment && paymentMethod === "cash" && (
        <div className="space-y-4 rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <div>
            <label htmlFor="cash-amount" className="mb-2 block text-sm font-medium text-slate-300">
              Amount received
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                id="cash-amount"
                type="number"
                step="0.01"
                min="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder={totalDollars.toFixed(2)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/50 pl-8 pr-4 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {cashReceived && !isNaN(cashReceivedNum) && (
            <div className="space-y-2 rounded-lg bg-slate-950/50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total due:</span>
                <span className="font-medium text-slate-200">${totalDollars.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Amount received:</span>
                <span className="font-medium text-slate-200">${cashReceivedNum.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-700 pt-2">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-slate-300">Change owed:</span>
                  <span
                    className={`text-lg font-bold ${
                      changeOwed >= 0 ? "text-emerald-300" : "text-red-400"
                    }`}
                  >
                    ${changeOwed.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {cashError && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {cashError}
            </p>
          )}

          <button
            type="button"
            onClick={handleCashPayment}
            disabled={processingCash || !cashReceived || cashReceivedNum < totalDollars}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingCash ? "Processing…" : "Mark as paid (cash)"}
          </button>

          <p className="text-[0.7rem] text-slate-500">
            This will mark the order as paid and update inventory. Make sure you&apos;ve received the cash before confirming.
          </p>
        </div>
      )}
    </div>
  );
}
