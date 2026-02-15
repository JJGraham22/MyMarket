"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/markets", label: "Markets" },
  { href: "/search", label: "Search" },
  { href: "/seller/checkout", label: "Sell" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // Get the current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setLoggingOut(false);
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-sm"
      style={{
        borderColor: "rgba(92, 64, 51, 0.35)",
        background: "rgba(26, 24, 20, 0.9)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? "btn-primary px-4 py-2 text-sm" : "btn-secondary px-4 py-2 text-sm"}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border-2 px-1.5 py-1 transition-all hover:opacity-95"
            style={{
              borderColor: "var(--market-red)",
              background: "var(--market-red-bg)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/market-stand-logo-v4.png"
              alt="My Market"
              className="rounded object-contain"
              style={{ width: "40px", height: "40px" }}
            />
            <span className="hidden font-bold sm:inline" style={{ color: "var(--market-red)" }}>
              My Market
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-[var(--cream-muted)] sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="btn-secondary rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </>
          ) : (
            <Link href="/auth" className="btn-primary inline-flex rounded-lg px-4 py-2.5 text-sm">
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
