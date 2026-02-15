"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SellerSessionOption = {
  id: string;
  label: string;
};

type Listing = {
  id: string;
  name: string;
  unit: string | null;
  price_cents: number;
  qty_available: number;
  qty_reserved: number;
};

type CartItem = Listing & {
  quantity: number;
};

type OrderResult = {
  orderId: string;
  totalCents: number;
  payUrl: string;
  expiresAt: string;
  status: string;
};

function ListingRow({
  listing,
  onAddToCart
}: {
  listing: Listing;
  onAddToCart: (listing: Listing, quantity: number) => void;
}) {
  const [qty, setQty] = useState(1);

  return (
    <tr className="border-t border-slate-800/70 hover:bg-slate-900/60">
      <td className="px-3 py-2 text-xs sm:text-sm">
        <div className="font-medium text-slate-50">{listing.name}</div>
      </td>
      <td className="px-3 py-2 text-xs text-slate-400">{listing.unit ?? "—"}</td>
      <td className="px-3 py-2 text-right text-xs sm:text-sm">
        ${(listing.price_cents / 100).toFixed(2)}
      </td>
      <td className="px-3 py-2 text-right text-xs text-slate-400">{listing.qty_available}</td>
      <td className="px-3 py-2 text-right text-xs">
        <input
          type="number"
          min={1}
          max={listing.qty_available}
          value={qty}
          onChange={(e) => {
            const next = Number(e.target.value);
            setQty(Number.isNaN(next) ? 1 : next);
          }}
          className="w-16 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-right text-xs text-slate-100"
        />
      </td>
      <td className="px-3 py-2 text-right text-xs">
        <button
          type="button"
          className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
          disabled={listing.qty_available <= 0}
          onClick={() => onAddToCart(listing, qty)}
        >
          Add
        </button>
      </td>
    </tr>
  );
}

function OrderResultPanel({
  orderResult,
  onStatusChange,
}: {
  orderResult: OrderResult;
  onStatusChange: (status: string) => void;
}) {
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Poll order status every 3 seconds while PENDING_PAYMENT
  useEffect(() => {
    if (orderResult.status !== "PENDING_PAYMENT") return;

    let cancelled = false;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/status?orderId=${orderResult.orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.status !== orderResult.status) {
            onStatusChange(data.status);
          }
        }
      } catch {
        // Network error — keep polling
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderResult.orderId, orderResult.status, onStatusChange]);

  async function handleComplete() {
    setCompleting(true);
    setCompleteError(null);
    try {
      const res = await fetch("/api/orders/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderResult.orderId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to complete order.");
      }
      onStatusChange("COMPLETED");
    } catch (err: unknown) {
      setCompleteError((err as Error).message);
    } finally {
      setCompleting(false);
    }
  }

  const isPaid = orderResult.status === "PAID";
  const isCompleted = orderResult.status === "COMPLETED";
  const isPending = orderResult.status === "PENDING_PAYMENT";

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs">
      <div className="flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold text-emerald-300">
          {isCompleted
            ? "Order completed"
            : isPaid
            ? "Paid"
            : "QR payment link created"}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
            isCompleted
              ? "bg-emerald-500/20 text-emerald-200"
              : isPaid
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-amber-500/20 text-amber-100"
          }`}
        >
          {orderResult.status}
          {isPending && " …"}
        </span>
      </div>

      <p className="text-slate-100">
        Order <span className="font-mono text-xs">{orderResult.orderId}</span> ·{" "}
        <span className="font-semibold">
          ${(orderResult.totalCents / 100).toFixed(2)} {isPaid || isCompleted ? "paid" : "due"}
        </span>
      </p>

      {isPending && (
        <>
          <p className="text-[0.7rem] text-emerald-200">
            Expires at:{" "}
            <span className="font-mono">
              {new Date(orderResult.expiresAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
          <p className="text-[0.7rem] text-slate-300">
            Show the QR to the buyer on this screen, or copy the link from the payment page.
            Checking for payment every few seconds…
          </p>
          <a
            href={orderResult.payUrl}
            className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-emerald-300 underline-offset-2 hover:underline"
          >
            Open payment page
          </a>
        </>
      )}

      {isPaid && (
        <div className="space-y-2">
          <p className="text-[0.7rem] text-emerald-200">
            The buyer has paid. Confirm pickup and complete the order.
          </p>
          <button
            type="button"
            className="btn-primary w-full justify-center"
            disabled={completing}
            onClick={handleComplete}
          >
            {completing ? "Completing…" : "Complete order"}
          </button>
          {completeError && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {completeError}
            </p>
          )}
        </div>
      )}

      {isCompleted && (
        <p className="text-[0.7rem] text-emerald-200">
          This order is complete. The buyer has collected their items.
        </p>
      )}
    </div>
  );
}

export function SellerCheckoutClient({ sellerSessions }: { sellerSessions: SellerSessionOption[] }) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sellerSessions[0]?.id ?? null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCents = useMemo(
    () => cart.reduce((sum, item) => sum + item.price_cents * item.quantity, 0),
    [cart]
  );

  useEffect(() => {
    if (!selectedSessionId) {
      setListings([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function loadListings() {
      setLoadingListings(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (selectedSessionId) params.set("sellerSessionId", selectedSessionId);
        if (searchTerm.trim().length > 0) params.set("q", searchTerm.trim());

        const res = await fetch(`/api/seller/listings?${params.toString()}`, {
          signal: controller.signal
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load listings");
        }
        const data: Listing[] = await res.json();
        if (!cancelled) {
          setListings(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          if ((err as Error).name !== "AbortError") {
            setError((err as Error).message);
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingListings(false);
        }
      }
    }

    void loadListings();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedSessionId, searchTerm]);

  function addToCart(listing: Listing, quantity: number) {
    if (quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === listing.id);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        return prev.map((i) => (i.id === listing.id ? { ...i, quantity: nextQty } : i));
      }
      return [...prev, { ...listing, quantity }];
    });
  }

  function updateCartQuantity(id: string, quantity: number) {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  async function handlePayByPhone() {
    if (!selectedSessionId || cart.length === 0) return;
    setPlacingOrder(true);
    setError(null);

    try {
      const res = await fetch("/api/seller/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sellerSessionId: selectedSessionId,
          items: cart.map((item) => ({
            listingId: item.id,
            quantity: item.quantity
          }))
        })
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to create order");
      }

      setOrderResult({
        orderId: body.orderId,
        totalCents: body.totalCents,
        payUrl: body.payUrl,
        expiresAt: body.expiresAt,
        status: "PENDING_PAYMENT"
      });
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setPlacingOrder(false);
    }
  }

  const selectedSessionLabel =
    sellerSessions.find((s) => s.id === selectedSessionId)?.label ?? "Select session";

  const canCheckout = !!selectedSessionId && cart.length > 0;

  const handleOrderStatusChange = useCallback((newStatus: string) => {
    setOrderResult((prev) => (prev ? { ...prev, status: newStatus } : prev));
  }, []);

  return (
    <div className="grid grid-2 gap-5">
      <section className="card p-5 space-y-4">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
                Seller checkout
              </p>
              <h2 className="text-lg font-semibold text-slate-50">
                Build cart for this buyer
              </h2>
            </div>
            <span className="badge-soft">
              {sellerSessions.length > 0 ? "Sessions ready" : "No seller sessions yet"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sellerSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className={`pill ${
                  session.id === selectedSessionId ? "pill-active" : ""
                } text-xs`}
                onClick={() => {
                  setSelectedSessionId(session.id);
                  setCart([]);
                  setOrderResult(null);
                }}
              >
                {session.label}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-center">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Search listings
              </label>
              <input
                className="input"
                placeholder="Type to search by name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-xs text-slate-400 sm:text-right">
              {selectedSessionId
                ? "Showing inventory for selected market day"
                : "Choose a market day session to see inventory"}
            </div>
          </div>
        </header>

        {error && (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {error}
          </p>
        )}

        <div className="max-h-[24rem] overflow-auto rounded-xl border border-slate-800/80 bg-slate-950/50">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Item</th>
                <th className="px-3 py-2 text-left font-medium">Unit</th>
                <th className="px-3 py-2 text-right font-medium">Price</th>
                <th className="px-3 py-2 text-right font-medium">Available</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Add</th>
              </tr>
            </thead>
            <tbody>
              {loadingListings && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Loading listings…
                  </td>
                </tr>
              )}
              {!loadingListings && listings.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-slate-500"
                  >
                    {selectedSessionId
                      ? "No listings found for this session."
                      : "Choose a seller session to view listings."}
                  </td>
                </tr>
              )}
              {!loadingListings &&
                listings.map((listing) => (
                  <ListingRow
                    key={listing.id}
                    listing={listing}
                    onAddToCart={addToCart}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-50">Current cart</h2>
            <p className="text-xs text-slate-400">
              Session: <span className="font-medium text-slate-200">{selectedSessionLabel}</span>
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="text-slate-400">Total</p>
            <p className="text-lg font-semibold text-emerald-300">
              ${(totalCents / 100).toFixed(2)}
            </p>
          </div>
        </header>

        <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-slate-800/80 bg-slate-950/40 p-3 text-xs">
          {cart.length === 0 && (
            <p className="text-slate-500">No items yet. Add items from the listings table.</p>
          )}
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-md border border-slate-800/60 bg-slate-900/60 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-slate-50">{item.name}</p>
                <p className="text-[0.7rem] text-slate-400">
                  {item.unit ?? "each"} · ${(item.price_cents / 100).toFixed(2)} · Avail:{" "}
                  {item.qty_available}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    updateCartQuantity(item.id, Number.isNaN(next) ? 1 : next);
                  }}
                  className="w-14 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-right text-[0.7rem] text-slate-100"
                />
                <div className="text-right">
                  <p className="text-[0.7rem] text-slate-400">Line</p>
                  <p className="text-xs font-semibold text-slate-50">
                    ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="rounded-full border border-slate-700 px-2 py-1 text-[0.65rem] text-slate-300 hover:border-red-500/60 hover:text-red-200"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            className="btn-primary w-full justify-center"
            disabled={!canCheckout || placingOrder}
            onClick={handlePayByPhone}
          >
            {placingOrder ? "Creating order…" : "Pay by phone (QR)"}
          </button>
          <p className="text-[0.7rem] text-slate-400">
            When you tap{" "}
            <span className="font-semibold text-emerald-300">Pay by phone (QR)</span>, an order is
            created and inventory reserved for 10 minutes while the buyer scans the QR code on
            their phone.
          </p>
        </div>

        {orderResult && (
          <OrderResultPanel
            orderResult={orderResult}
            onStatusChange={handleOrderStatusChange}
          />
        )}
      </section>
    </div>
  );
}

