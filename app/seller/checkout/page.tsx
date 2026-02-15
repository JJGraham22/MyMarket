import { SellerCheckoutClient } from "./SellerCheckoutClient";
import { createServerSupabaseClient } from "@/lib/supabaseClient";

type SellerSessionRow = {
  id: string;
  market_day_id: string;
  stall_number: string | null;
};

type MarketDayRow = {
  id: string;
  date: string;
};

function hasServerSupabaseConfig(): boolean {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && serviceKey);
}

async function getSellerSessionsWithLabels() {
  if (!hasServerSupabaseConfig()) {
    return [];
  }

  const supabase = createServerSupabaseClient();

  // For now, we look up sessions using a dev seller id so the page
  // works before auth wiring is in place.
  const devSellerId = process.env.NEXT_PUBLIC_DEV_SELLER_ID;

  if (!devSellerId) {
    return [];
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from("seller_sessions")
    .select("id, market_day_id, stall_number")
    .eq("seller_id", devSellerId)
    .order("created_at", { ascending: false });

  if (sessionsError || !sessions || sessions.length === 0) {
    return [];
  }

  const marketDayIds = Array.from(
    new Set(
      (sessions as SellerSessionRow[]).map((s) => s.market_day_id).filter((id) => Boolean(id))
    )
  );

  const { data: marketDays } = await supabase
    .from("market_days")
    .select("id, date")
    .in("id", marketDayIds);

  const marketDaysById = new Map<string, MarketDayRow>();
  (marketDays as MarketDayRow[] | null)?.forEach((md) => {
    marketDaysById.set(md.id, md);
  });

  return (sessions as SellerSessionRow[]).map((session) => {
    const md = marketDaysById.get(session.market_day_id);
    const dateLabel = md ? new Date(md.date).toLocaleDateString() : "Unknown date";
    const stall = session.stall_number ? ` · Stall ${session.stall_number}` : "";
    return {
      id: session.id,
      label: `${dateLabel}${stall}`
    };
  });
}

export default async function SellerCheckoutPage() {
  const sellerSessions = await getSellerSessionsWithLabels();

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-emerald-300/80">My Market · Seller checkout</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Market day checkout
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Select a market day session, add items from your inventory to the buyer&apos;s cart, and
          generate a QR payment link that reserves inventory for 10 minutes.
        </p>
      </header>

      {!hasServerSupabaseConfig() && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Set <code className="font-mono text-[0.7rem]">SUPABASE_URL</code> (or{" "}
          <code className="font-mono text-[0.7rem]">NEXT_PUBLIC_SUPABASE_URL</code>) and{" "}
          <code className="font-mono text-[0.7rem]">SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
          <code className="font-mono text-[0.7rem]">.env.local</code> so the server can load seller
          sessions.
        </p>
      )}
      {hasServerSupabaseConfig() && !process.env.NEXT_PUBLIC_DEV_SELLER_ID && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Set <code className="font-mono text-[0.7rem]">NEXT_PUBLIC_DEV_SELLER_ID</code> in{" "}
          <code className="font-mono text-[0.7rem]">.env.local</code> to preview seller sessions
          before wiring Supabase Auth.
        </p>
      )}

      <SellerCheckoutClient sellerSessions={sellerSessions} />
    </main>
  );
}

