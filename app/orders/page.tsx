import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OrdersClient } from "./OrdersClient";

export const metadata = {
  title: "Orders — My Market",
};

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  seller_session_id: string;
  seller_sessions?: {
    market_days?: {
      markets?: { name: string } | null;
      date?: string;
    } | null;
  } | null;
}

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=" + encodeURIComponent("/orders"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role === "seller" ? "seller" : "buyer") as "buyer" | "seller";

  const selectOrderFields = "id, status, total_cents, created_at, seller_session_id, seller_sessions(market_days(markets(name), date))";

  let orders: OrderRow[] = [];

  if (role === "buyer") {
    const { data } = await supabase
      .from("orders")
      .select(selectOrderFields)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    orders = (data ?? []) as OrderRow[];
  } else {
    const { data: sessions } = await supabase
      .from("seller_sessions")
      .select("id")
      .eq("seller_id", user.id);
    const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);
    if (sessionIds.length > 0) {
      const { data } = await supabase
        .from("orders")
        .select(selectOrderFields)
        .in("seller_session_id", sessionIds)
        .order("created_at", { ascending: false });
      orders = (data ?? []) as OrderRow[];
    }
  }

  return <OrdersClient orders={orders} role={role} />;
}
