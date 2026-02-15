"use client";

import { useState } from "react";

export function PayNowButton({
  orderId,
  disabled,
}: {
  orderId: string;
  disabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      if (!body.url) {
        throw new Error("No checkout URL returned. Please try again.");
      }

      // Redirect to Stripe Checkout
      window.location.href = body.url;
    } catch (err: unknown) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn-primary w-full justify-center"
        disabled={disabled || loading}
        onClick={handleClick}
      >
        {loading ? "Redirecting to payment…" : "Pay now"}
      </button>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      )}
    </div>
  );
}
