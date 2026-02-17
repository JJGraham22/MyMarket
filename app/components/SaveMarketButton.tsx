"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/app/components/ui";

interface SaveMarketButtonProps {
  marketId: string;
}

export function SaveMarketButton({ marketId }: SaveMarketButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUserId(session.user.id);
      const { data } = await supabase
        .from("saved_markets")
        .select("market_id")
        .eq("user_id", session.user.id)
        .eq("market_id", marketId)
        .maybeSingle();
      setSaved(!!data);
      setLoading(false);
    }
    init();
  }, [marketId]);

  async function handleToggle() {
    if (!userId) return;
    setToggling(true);
    const supabase = createBrowserSupabaseClient();
    if (saved) {
      await supabase.from("saved_markets").delete().eq("user_id", userId).eq("market_id", marketId);
      setSaved(false);
    } else {
      await supabase.from("saved_markets").insert({ user_id: userId, market_id: marketId });
      setSaved(true);
    }
    setToggling(false);
  }

  if (loading) {
    return (
      <span className="inline-block h-10 w-28 animate-pulse rounded-lg bg-[var(--brown-bg)]" aria-hidden />
    );
  }

  if (!userId) {
    return (
      <Link href={"/auth?next=" + encodeURIComponent("/markets/" + marketId)}>
        <Button type="button" variant="secondary" className="gap-2">
          Save market
        </Button>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant={saved ? "primary" : "secondary"}
      onClick={handleToggle}
      disabled={toggling}
      className="gap-2"
    >
      {toggling ? "…" : saved ? "Saved" : "Save market"}
    </Button>
  );
}
