"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { PageHeader, Card, Button, Input, EmptyState, Skeleton } from "@/app/components/ui";

interface SessionOption {
  id: string;
  label: string;
  date: string;
  isToday: boolean;
}

interface ListingRow {
  id: string;
  name: string;
  unit: string | null;
  price_cents: number;
  qty_available: number;
  qty_reserved: number;
  seller_session_id: string;
}

interface MarketDay {
  id: string;
  date: string;
  markets: { id: string; name: string } | null;
}

export function InventoryClient() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [allMarketDays, setAllMarketDays] = useState<MarketDay[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadSessions = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: sessionRows } = await supabase
      .from("seller_sessions")
      .select("id, market_day_id, stall_number, market_days(id, date, market_id, markets(id, name))")
      .eq("seller_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!sessionRows) {
      setSessions([]);
      return;
    }

    const options: SessionOption[] = (sessionRows as any[]).map((s) => {
      const md = s.market_days;
      const mkt = md?.markets;
      const dateStr = md?.date ? new Date(md.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Unknown";
      const marketName = mkt?.name ?? "Market";
      const stall = s.stall_number ? ` · Stall ${s.stall_number}` : "";
      return {
        id: s.id,
        label: `${marketName} — ${dateStr}${stall}`,
        date: md?.date ?? "",
        isToday: md?.date === today,
      };
    });
    setSessions(options);
    if (options.length > 0 && !selectedSessionId) setSelectedSessionId(options[0].id);
  }, [today, selectedSessionId]);

  const loadAllMarketDays = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    // Load all market days (past, today, and future) so sellers can select any market
    const { data } = await supabase
      .from("market_days")
      .select("id, date, markets(id, name)")
      .order("date", { ascending: false })
      .limit(100); // Reasonable limit
    setAllMarketDays((data as unknown as MarketDay[]) ?? []);
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUserId(session.user.id);
      await loadAllMarketDays();
      await loadSessions();
      setLoading(false);
    }
    init();
  }, [loadAllMarketDays, loadSessions]);

  const loadListings = useCallback(async () => {
    if (!selectedSessionId) {
      setListings([]);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from("listings")
      .select("id, name, unit, price_cents, qty_available, qty_reserved, seller_session_id")
      .eq("seller_session_id", selectedSessionId)
      .order("name", { ascending: true });
    setListings((data as ListingRow[]) ?? []);
  }, [selectedSessionId]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const [existingSessionMarketDayIds, setExistingSessionMarketDayIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!userId) return;
    const supabase = createBrowserSupabaseClient();
    supabase
      .from("seller_sessions")
      .select("market_day_id")
      .eq("seller_id", userId)
      .then(({ data }) => {
        const ids = new Set((data ?? []).map((s: { market_day_id: string }) => s.market_day_id));
        setExistingSessionMarketDayIds(ids);
      });
  }, [userId, sessions]);

  // Filter out market days where user already has a session
  const availableMarketDays = allMarketDays.filter((md) => !existingSessionMarketDayIds.has(md.id));
  const todayMarketDays = allMarketDays.filter((md) => md.date === today);

  async function startSession(marketDayId: string) {
    if (!userId) return;
    setStarting(marketDayId);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error: insertError } = await supabase.from("seller_sessions").insert({
      seller_id: userId,
      market_day_id: marketDayId,
    });
    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage("Session started.");
      await loadSessions();
    }
    setStarting(null);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory"
        subtitle="Manage listings for a market day. Start today's session, then add or edit items."
      />

      {loading ? (
        <Skeleton lines={5} />
      ) : !userId ? (
        <p className="text-sm text-[var(--cream-muted)]">Sign in as a seller to manage inventory.</p>
      ) : (
        <>
          {/* Start a market session */}
          {availableMarketDays.length > 0 && (
            <Card padding="md">
              <h2 className="section-heading mb-3">Start a market session</h2>
              <p className="mb-4 text-sm text-[var(--cream-muted)]">
                You need a session for a market day to add listings. Select a market and date below to start one.
              </p>
              <div className="space-y-2">
                {availableMarketDays.map((md) => {
                  const dateObj = new Date(md.date + "T00:00:00");
                  const dateStr = dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                  const isToday = md.date === today;
                  const marketName = md.markets?.name ?? "Market";
                  return (
                    <div key={md.id} className="flex items-center justify-between rounded-lg border border-[rgba(168,137,104,0.2)] bg-[var(--brown-bg)] px-4 py-2.5">
                      <div>
                        <span className="font-medium text-[var(--cream)]">{marketName}</span>
                        <span className="ml-2 text-sm text-[var(--cream-muted)]">{dateStr}</span>
                        {isToday && (
                          <span className="ml-2 rounded-full bg-[var(--green-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--green-pale)]">
                            Today
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => startSession(md.id)}
                        disabled={starting === md.id}
                      >
                        {starting === md.id ? "Starting…" : "Start session"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {availableMarketDays.length === 0 && allMarketDays.length > 0 && (
            <Card padding="md">
              <p className="text-sm text-[var(--green-pale)]">
                You already have sessions for all available market days. Use the dropdown below to select a session and add items.
              </p>
            </Card>
          )}

          {allMarketDays.length === 0 && (
            <Card padding="md">
              <p className="text-sm text-[var(--cream-muted)]">
                No market days found. Market days need to be created first. Contact your market administrator or create them in the markets section.
              </p>
            </Card>
          )}

          {/* Session select + Add form + Listings */}
          <Card padding="lg" className="space-y-6">
            <div>
              <label htmlFor="session" className="mb-2 block text-sm font-medium text-[var(--cream-muted)]">
                Market day
              </label>
              <select
                id="session"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="input w-full max-w-md"
              >
                <option value="">Select a session…</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {selectedSessionId && (
              <>
                <AddListingForm
                  sessionId={selectedSessionId}
                  onAdded={() => { setError(null); setMessage("Item added."); loadListings(); }}
                  onError={setError}
                  adding={adding}
                  setAdding={setAdding}
                />
                {error && <p className="text-sm text-red-300">{error}</p>}
                {message && <p className="text-sm text-[var(--green-pale)]">{message}</p>}

                <div>
                  <h3 className="mb-3 font-semibold text-[var(--cream)]">Items</h3>
                  {listings.length === 0 ? (
                    <EmptyState message="No items yet. Add one above." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="table-head">
                          <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Unit</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 w-32"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(168,137,104,0.2)]">
                          {listings.map((row) =>
                            editingId === row.id ? (
                              <ListingEditRow
                                key={row.id}
                                row={row}
                                onSave={() => { setEditingId(null); loadListings(); }}
                                onCancel={() => setEditingId(null)}
                              />
                            ) : (
                              <tr key={row.id} className="hover:bg-[var(--brown-bg)]/30">
                                <td className="px-4 py-3 font-medium text-[var(--cream)]">{row.name}</td>
                                <td className="px-4 py-3 text-[var(--cream-muted)]">{row.unit ?? "—"}</td>
                                <td className="px-4 py-3 text-right">${(row.price_cents / 100).toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">{row.qty_available}</td>
                                <td className="px-4 py-3">
                                  <Button type="button" variant="ghost" onClick={() => setEditingId(row.id)}>
                                    Edit
                                  </Button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {sessions.length === 0 && (
              <p className="text-sm text-[var(--cream-muted)]">
                Start a session above or create one from Seller Checkout, then come back to add items.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function AddListingForm({
  sessionId,
  onAdded,
  onError,
  adding,
  setAdding,
}: {
  sessionId: string;
  onAdded: () => void;
  onError: (s: string | null) => void;
  adding: boolean;
  setAdding: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    const nameTrim = name.trim();
    const priceCents = Math.round(parseFloat(price) * 100);
    const qtyNum = parseInt(qty, 10) || 0;
    if (!nameTrim) { onError("Name is required."); return; }
    if (Number.isNaN(priceCents) || priceCents < 0) { onError("Valid price required."); return; }
    if (qtyNum < 0) { onError("Qty must be ≥ 0."); return; }

    setAdding(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("listings").insert({
      seller_session_id: sessionId,
      name: nameTrim,
      unit: unit.trim() || null,
      price_cents: priceCents,
      qty_available: qtyNum,
      qty_reserved: 0,
      is_active: true,
    });
    setAdding(false);
    if (error) {
      onError(error.message);
      return;
    }
    setName("");
    setUnit("");
    setPrice("");
    setQty("0");
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <Input id="add-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tomatoes" required />
      <Input id="add-unit" label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, each" />
      <Input id="add-price" label="Price ($)" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required />
      <Input id="add-qty" label="Qty" type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} required />
      <Button type="submit" disabled={adding}>{adding ? "Adding…" : "Add item"}</Button>
    </form>
  );
}

function ListingEditRow({
  row,
  onSave,
  onCancel,
}: {
  row: ListingRow;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [unit, setUnit] = useState(row.unit ?? "");
  const [price, setPrice] = useState((row.price_cents / 100).toFixed(2));
  const [qty, setQty] = useState(String(row.qty_available));
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(price) * 100);
    const qtyNum = parseInt(qty, 10);
    if (Number.isNaN(priceCents) || priceCents < 0 || qtyNum < 0) return;
    setSaving(true);
    const supabase = createBrowserSupabaseClient();
    await supabase
      .from("listings")
      .update({
        name: name.trim(),
        unit: unit.trim() || null,
        price_cents: priceCents,
        qty_available: qtyNum,
      })
      .eq("id", row.id);
    setSaving(false);
    onSave();
  }

  return (
    <tr className="bg-[var(--brown-bg)]/30">
      <td className="px-4 py-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className="input w-full min-w-[120px]" required />
      </td>
      <td className="px-4 py-2">
        <input value={unit} onChange={(e) => setUnit(e.target.value)} className="input w-full min-w-[80px]" />
      </td>
      <td className="px-4 py-2">
        <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="input w-24 text-right" />
      </td>
      <td className="px-4 py-2">
        <input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} className="input w-20 text-right" />
      </td>
      <td className="px-4 py-2 flex gap-2">
        <Button type="button" onClick={handleSave} disabled={saving}>{saving ? "…" : "Save"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </td>
    </tr>
  );
}
