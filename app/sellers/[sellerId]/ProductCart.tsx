"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/app/components/ui";

interface Listing {
  id: string;
  name: string;
  price_cents: number;
  unit: string | null;
  qty_available: number;
  seller_session_id: string;
}

interface CartItem {
  listingId: string;
  listing: Listing;
  quantity: number;
}

interface ProductCartProps {
  listings: Listing[];
  sellerSessionIds: string[];
  accentColor?: string;
}

export function ProductCart({ listings, sellerSessionIds, accentColor = "#4a7c23" }: ProductCartProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUserId(session?.user.id ?? null);
    }
    checkAuth();
  }, []);

  // Determine which session to use for orders
  // Prefer the session that has the most items in the cart, or the first available session
  function getSelectedSessionId(): string | null {
    if (cart.length === 0 || sellerSessionIds.length === 0) return null;
    
    // Count items per session
    const sessionCounts = new Map<string, number>();
    cart.forEach(item => {
      const sessionId = item.listing.seller_session_id;
      sessionCounts.set(sessionId, (sessionCounts.get(sessionId) ?? 0) + 1);
    });
    
    // Find the session with the most items
    let maxCount = 0;
    let bestSessionId: string | null = null;
    sessionCounts.forEach((count, sessionId) => {
      if (count > maxCount && sellerSessionIds.includes(sessionId)) {
        maxCount = count;
        bestSessionId = sessionId;
      }
    });
    
    // If we found a session with items, use it; otherwise use the first available
    return bestSessionId ?? sellerSessionIds[0];
  }
  
  // Check if all items are from the same session
  function areAllItemsFromSameSession(): boolean {
    if (cart.length === 0) return true;
    const firstSessionId = cart[0].listing.seller_session_id;
    return cart.every(item => item.listing.seller_session_id === firstSessionId);
  }

  function updateCartQuantity(listingId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.listingId !== listingId));
      return;
    }

    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.listingId === listingId);
      if (existing) {
        return prev.map((item) =>
          item.listingId === listingId ? { ...item, quantity } : item
        );
      } else {
        return [...prev, { listingId, listing, quantity }];
      }
    });
  }

  function getCartQuantity(listingId: string): number {
    const item = cart.find((i) => i.listingId === listingId);
    return item?.quantity ?? 0;
  }

  function getCartTotal(): number {
    return cart.reduce((sum, item) => sum + item.listing.price_cents * item.quantity, 0);
  }

  async function handleCreateOrder() {
    if (cart.length === 0) {
      setError("Please add items to your cart first.");
      return;
    }

    const selectedSessionId = getSelectedSessionId();
    if (!selectedSessionId) {
      setError("No active seller session found. Please contact the seller.");
      return;
    }

    // Filter items to only those from the selected session
    const itemsForSession = cart.filter(item => item.listing.seller_session_id === selectedSessionId);
    
    if (itemsForSession.length === 0) {
      setError("No items available for the selected market session.");
      return;
    }

    setIsCreatingOrder(true);
    setError(null);
    
    // Note: If items are from different sessions, we only order items from the selected session
    // The user can create a separate order for items from other sessions

    try {
      const res = await fetch("/api/seller/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerSessionId: selectedSessionId,
          items: itemsForSession.map((item) => ({
            listingId: item.listingId,
            quantity: item.quantity,
          })),
          customerId: userId,
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

  if (listings.length === 0) {
    return (
      <div className="card-organic px-6 py-10 text-center">
        <p className="text-sm text-[var(--cream-muted)]">No active listings right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {listings.map((listing) => {
          const cartQty = getCartQuantity(listing.id);
          const isOutOfStock = listing.qty_available === 0;
          
          return (
            <div
              key={listing.id}
              className="card-organic p-5"
              style={{ borderColor: accentColor ? `${accentColor}40` : undefined }}
            >
              <h3 className="font-semibold text-[var(--cream)]">
                {listing.name}
                {isOutOfStock && (
                  <span className="ml-2 text-xs font-normal text-amber-400">(out of stock)</span>
                )}
              </h3>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-medium" style={{ color: accentColor || "var(--green-pale)" }}>
                  ${(listing.price_cents / 100).toFixed(2)}
                  {listing.unit && <span className="text-[var(--cream-muted)]"> / {listing.unit}</span>}
                </span>
                <span className="text-[var(--cream-muted)]">{listing.qty_available} available</span>
              </div>

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(listing.id, Math.max(0, cartQty - 1))}
                      disabled={cartQty === 0}
                      className="flex h-8 w-8 items-center justify-center rounded border border-[rgba(168,137,104,0.3)] bg-[var(--ground-elevated)] text-[var(--cream-muted)] transition-colors hover:border-[var(--green-soft)] hover:text-[var(--green-pale)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-medium text-[var(--cream)]">
                      {cartQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(listing.id, Math.min(listing.qty_available, cartQty + 1))}
                      disabled={cartQty >= listing.qty_available}
                      className="flex h-8 w-8 items-center justify-center rounded border border-[rgba(168,137,104,0.3)] bg-[var(--ground-elevated)] text-[var(--cream-muted)] transition-colors hover:border-[var(--green-soft)] hover:text-[var(--green-pale)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cart Summary & Checkout */}
      {cart.length > 0 && (
        <div className="card-organic p-6">
          <h3 className="mb-4 font-semibold text-[var(--cream)]">Order Summary</h3>
          <div className="space-y-2 mb-4">
            {cart.map((item) => (
              <div key={item.listingId} className="flex items-center justify-between text-sm">
                <span className="text-[var(--cream-muted)]">
                  {item.listing.name} × {item.quantity}
                  {item.listing.unit && ` ${item.listing.unit}`}
                </span>
                <span className="font-medium text-[var(--cream)]">
                  ${((item.listing.price_cents * item.quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mb-4 flex items-center justify-between border-t border-[rgba(168,137,104,0.2)] pt-4">
            <span className="font-semibold text-[var(--cream)]">Total</span>
            <span className="text-lg font-bold" style={{ color: accentColor || "var(--green-pale)" }}>
              ${(getCartTotal() / 100).toFixed(2)}
            </span>
          </div>
          {!areAllItemsFromSameSession() && (
            <div className="mb-4 rounded bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-sm text-amber-300">
              Note: Items are from different market sessions. The order will use the most common session.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              onClick={handleCreateOrder}
              disabled={isCreatingOrder || !getSelectedSessionId()}
              className="flex-1"
            >
              {isCreatingOrder ? "Creating order..." : "Reserve & Pay"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCart([])}
              disabled={isCreatingOrder}
            >
              Clear
            </Button>
          </div>
          {isAuthenticated === false && (
            <p className="mt-2 text-xs text-[var(--cream-muted)]">
              You can order as a guest. Sign in to track your orders.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
