"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { Card, Button, EmptyState, Skeleton } from "@/app/components/ui";

interface SessionOption {
  id: string;
  label: string;
}

interface ListingRow {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  price_cents: number;
  qty_available: number;
  qty_reserved: number;
  is_active: boolean;
  seller_session_id: string;
}

export function MyProducts({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [formSessionId, setFormSessionId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formQty, setFormQty] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data: sessionRows } = await supabase
      .from("seller_sessions")
      .select("id, market_day_id, stall_number, market_days(id, date, market_id, markets(id, name))")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (!sessionRows) {
      setSessions([]);
      return;
    }

    const options: SessionOption[] = (sessionRows as any[]).map((s) => {
      const md = s.market_days;
      const mkt = md?.markets;
      const dateStr = md?.date ? new Date(md.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Unknown";
      const marketName = mkt?.name ?? "Market";
      const stall = s.stall_number ? ` · Stall ${s.stall_number}` : "";
      return {
        id: s.id,
        label: `${marketName} — ${dateStr}${stall}`,
      };
    });
    setSessions(options);
    if (options.length > 0 && !formSessionId) setFormSessionId(options[0].id);
  }, [userId, formSessionId]);

  const loadListings = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data: sessionRows } = await supabase
      .from("seller_sessions")
      .select("id")
      .eq("seller_id", userId);

    if (!sessionRows || sessionRows.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }

    const sessionIds = (sessionRows as { id: string }[]).map((s) => s.id);
    const { data } = await supabase
      .from("listings")
      .select("id, name, description, unit, price_cents, qty_available, qty_reserved, is_active, seller_session_id")
      .in("seller_session_id", sessionIds)
      .order("seller_session_id", { ascending: false })
      .order("name", { ascending: true });

    setListings((data as ListingRow[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadListings().then(() => setLoading(false));
  }, [loadListings]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const name = formName.trim();
    const priceCents = Math.round(parseFloat(formPrice) * 100);
    const qty = parseInt(formQty, 10) || 0;

    if (!name) {
      setError("Product name is required.");
      return;
    }
    if (!formSessionId) {
      setError("Please select a market day.");
      return;
    }
    if (Number.isNaN(priceCents) || priceCents < 0) {
      setError("Enter a valid price.");
      return;
    }
    if (qty < 0) {
      setError("Quantity cannot be negative.");
      return;
    }

    setAdding(true);
    const supabase = createBrowserSupabaseClient();
    const { error: insertError } = await supabase.from("listings").insert({
      seller_session_id: formSessionId,
      name,
      description: formDescription.trim() || null,
      unit: formUnit.trim() || null,
      price_cents: priceCents,
      qty_available: qty,
      qty_reserved: 0,
      is_active: true,
    });

    if (insertError) {
      setError(insertError.message);
      setAdding(false);
      return;
    }

    setMessage("Product added.");
    setFormName("");
    setFormDescription("");
    setFormUnit("");
    setFormPrice("");
    setFormQty("0");
    loadListings();
    setAdding(false);
  }

  async function handleDelete(listingId: string) {
    if (!confirm("Remove this product? It will be hidden from checkout and your public profile.")) return;
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from("listings")
      .update({ is_active: false })
      .eq("id", listingId);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage("Product removed.");
    loadListings();
  }

  const sessionLabels = new Map(sessions.map((s) => [s.id, s.label]));
  const activeListings = listings.filter((l) => l.is_active);

  return (
    <div className="space-y-6">
      <h2 className="section-heading">My products</h2>
      <p className="text-sm text-[var(--cream-muted)]">
        Add items to a market day. They appear in Seller Checkout and on your public profile for that day.
      </p>

      {/* Add form */}
      <form onSubmit={handleAdd}>
        <Card padding="md" className="space-y-4">
        <h3 className="font-semibold text-[var(--cream)]">Add product</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--cream-muted)]">Market day</label>
            <select
              value={formSessionId}
              onChange={(e) => setFormSessionId(e.target.value)}
              className="input"
              required
            >
              <option value="">Select a market day…</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--cream-muted)]">Product name *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Organic tomatoes"
              className="input"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--cream-muted)]">Unit (optional)</label>
            <input
              type="text"
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
              placeholder="e.g. kg, bunch, each"
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--cream-muted)]">Price ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              placeholder="0.00"
              className="input"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--cream-muted)]">Initial quantity *</label>
            <input
              type="number"
              min="0"
              value={formQty}
              onChange={(e) => setFormQty(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--cream-muted)]">Description (optional)</label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Short description"
              className="input"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {message && <p className="text-sm text-[var(--green-pale)]">{message}</p>}
        <Button type="submit" disabled={adding || sessions.length === 0}>
          {adding ? "Adding…" : "Add product"}
        </Button>
        </Card>
      </form>

      {sessions.length === 0 && (
        <div className="card-organic px-6 py-8 text-center">
          <p className="text-sm text-[var(--cream-muted)]">
            You don’t have a market day yet. <Link href="/seller/checkout" className="link-button">Open Seller Checkout</Link> and select or create a session there first; then come back here to add products.
          </p>
        </div>
      )}

      {/* List */}
      <div>
        <h3 className="mb-3 font-semibold text-[var(--cream)]">Current products</h3>
        {loading ? (
          <Skeleton lines={3} />
        ) : activeListings.length === 0 ? (
          <EmptyState message="No products yet. Add one above." />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">Market day</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(168,137,104,0.15)]">
                {activeListings.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--brown-bg)]/30">
                    <td className="px-4 py-3 font-medium text-[var(--cream)]">{row.name}</td>
                    <td className="px-4 py-3 text-[var(--cream-muted)]">{row.unit ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-[var(--cream)]">${(row.price_cents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-[var(--cream-muted)]">{row.qty_available}</td>
                    <td className="px-4 py-3 text-xs text-[var(--cream-muted)]">{sessionLabels.get(row.seller_session_id) ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Button type="button" variant="remove" onClick={() => handleDelete(row.id)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
