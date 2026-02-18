"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Listing {
  id: string;
  name: string;
  price_cents: number;
  unit: string | null;
  qty_available: number;
  is_active: boolean;
}

interface SellerOrderCardProps {
  sellerId: string;
  sellerName: string;
  sellerInitials: string;
  stallNumber: string | null;
  listings: Listing[];
  sessionId: string;
}

export function SellerOrderCard({
  sellerId,
  sellerName,
  sellerInitials,
  stallNumber,
  listings,
  sessionId,
}: SellerOrderCardProps) {
  const router = useRouter();
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);

  function updateQuantity(listingId: string, delta: number) {
    setCart((prev) => {
      const newCart = new Map(prev);
      const current = newCart.get(listingId) ?? 0;
      const listing = listings.find((l) => l.id === listingId);
      if (!listing) return prev;

      const newQty = Math.max(0, Math.min(listing.qty_available, current + delta));
      if (newQty === 0) {
        newCart.delete(listingId);
      } else {
        newCart.set(listingId, newQty);
      }
      return newCart;
    });
  }

  function getCartTotal(): number {
    let total = 0;
    cart.forEach((qty, listingId) => {
      const listing = listings.find((l) => l.id === listingId);
      if (listing) {
        total += listing.price_cents * qty;
      }
    });
    return total;
  }

  async function handleCreateOrder() {
    if (cart.size === 0) {
      setError("Please add items to your cart first.");
      return;
    }

    setIsCreatingOrder(true);
    setError(null);

    try {
      const res = await fetch("/api/seller/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerSessionId: sessionId,
          items: Array.from(cart.entries()).map(([listingId, quantity]) => ({
            listingId,
            quantity,
          })),
          customerId: null, // Guest checkout
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to create order");
      }

      // Redirect to payment page
      router.push(body.payUrl || `/pay/${body.orderId}`);
    } catch (err: unknown) {
      setError((err as Error).message);
      setIsCreatingOrder(false);
    }
  }

  const cartTotal = getCartTotal();
  const hasItemsInCart = cart.size > 0;

  return (
    <div className="card-organic group p-5 transition-colors hover:border-[var(--green-soft)]/30">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: "var(--green-bg)", color: "var(--green-pale)" }}>
          {sellerInitials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[var(--cream)] group-hover:text-[var(--green-pale)]">
            {sellerName}
          </h3>
          {stallNumber && <p className="text-xs text-[var(--cream-muted)]">Stall {stallNumber}</p>}
        </div>
      </div>

      {listings.length > 0 ? (
        <ul className="space-y-1 mb-3">
          {listings.map((listing) => {
            const qty = cart.get(listing.id) ?? 0;
            const isOutOfStock = listing.qty_available === 0;
            
            return (
              <li key={listing.id} className="flex items-center justify-between text-xs">
                <div className="flex-1 min-w-0">
                  <span className="truncate text-[var(--cream-muted)]">
                    {listing.name}
                    {listing.unit && ` / ${listing.unit}`}
                    {isOutOfStock && (
                      <span className="ml-1 text-[0.65rem] text-amber-400">(out of stock)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {!isOutOfStock && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateQuantity(listing.id, -1)}
                        disabled={qty === 0}
                        className="flex h-6 w-6 items-center justify-center rounded border border-[rgba(168,137,104,0.3)] bg-[var(--ground-elevated)] text-[var(--cream-muted)] text-xs transition-colors hover:border-[var(--green-soft)] hover:text-[var(--green-pale)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span className="min-w-[1.5rem] text-center text-xs font-medium text-[var(--cream)]">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(listing.id, 1)}
                        disabled={qty >= listing.qty_available}
                        className="flex h-6 w-6 items-center justify-center rounded border border-[rgba(168,137,104,0.3)] bg-[var(--ground-elevated)] text-[var(--cream-muted)] text-xs transition-colors hover:border-[var(--green-soft)] hover:text-[var(--green-pale)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </>
                  )}
                  <span className="ml-2 shrink-0 min-w-[3rem] text-right" style={{ color: "var(--green-pale)" }}>
                    ${(listing.price_cents / 100).toFixed(2)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-[var(--cream-muted)] mb-3">No listings yet</p>
      )}

      {hasItemsInCart && (
        <div className="mt-3 pt-3 border-t border-[rgba(168,137,104,0.2)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--cream)]">Total</span>
            <span className="text-sm font-bold" style={{ color: "var(--green-pale)" }}>
              ${(cartTotal / 100).toFixed(2)}
            </span>
          </div>
          {error && (
            <div className="mb-2 rounded bg-red-500/20 border border-red-500/30 px-2 py-1 text-xs text-red-300">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleCreateOrder}
            disabled={isCreatingOrder}
            className="w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--green-bg)", color: "var(--green-pale)" }}
          >
            {isCreatingOrder ? "Creating order..." : "Order & Pay Online"}
          </button>
        </div>
      )}

      <Link
        href={`/sellers/${sellerId}`}
        className="mt-3 block text-sm font-medium text-center"
        style={{ color: "var(--green-pale)" }}
      >
        View seller profile &rarr;
      </Link>
    </div>
  );
}
