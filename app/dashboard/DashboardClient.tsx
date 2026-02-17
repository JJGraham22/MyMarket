"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { SellerDashboard } from "./SellerDashboard";
import { BuyerDashboard } from "./BuyerDashboard";

interface Profile {
  id: string;
  role: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export function DashboardClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserSupabaseClient();

      // 1. Check session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/auth?next=" + encodeURIComponent("/dashboard"));
        return;
      }

      // 2. Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, role, display_name, avatar_url, bio")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        // Profile row might not exist yet (trigger delay) — create a minimal one
        setProfile({
          id: session.user.id,
          role: "buyer",
          display_name: session.user.email?.split("@")[0] ?? null,
          avatar_url: null,
          bio: null,
        });
      }

      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--cream-muted)]">Loading dashboard…</div>
      </div>
    );
  }

  if (!profile) {
    return null; // redirecting to /auth
  }

  if (profile.role === "seller") {
    return (
      <SellerDashboard
        displayName={profile.display_name}
        userId={profile.id}
      />
    );
  }

  return (
    <BuyerDashboard displayName={profile.display_name} userId={profile.id} />
  );
}
