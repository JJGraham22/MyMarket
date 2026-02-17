"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

/* ── Types ── */

interface NavbarUser {
  id: string;
  email: string | null;
}

interface NavbarProps {
  user: NavbarUser | null;
}

/* ── Nav link definitions ── */

const NAV_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/search", label: "Search" },
  { href: "/sell", label: "Sell" },
  { href: "/orders", label: "Orders" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

/* ── Styles ── */

const PILL =
  "rounded-lg border border-white/15 px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10";
const PILL_ACTIVE =
  "rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15";

/* ── Component ── */

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Close avatar dropdown on outside click */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Close menus on route change */
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
    setLoggingOut(false);
    router.push("/");
    router.refresh();
  }

  /* Helpers */
  const loginHref = "/auth?next=" + encodeURIComponent(pathname || "/");
  const avatarLetter = (user?.email?.charAt(0) ?? "?").toUpperCase();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  /* ── Render ── */

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-nowrap items-center justify-between px-4 py-3">
        {/* ── Left: Logo + Desktop nav links ── */}
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/market-logo.png"
              alt=""
              className="rounded object-contain"
              style={{ width: 28, height: 28 }}
            />
            <span className="text-sm font-bold text-white/90">My Market</span>
          </Link>

          {/* Desktop nav — hidden below md */}
          <nav className="flex items-center gap-2">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={isActive(href) ? PILL_ACTIVE : PILL}
                aria-current={isActive(href) ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Right: Auth controls + Mobile hamburger (always far-right) ── */}
        <div className="flex shrink-0 items-center gap-2 pl-4">
          {/* Auth: Log-in button or avatar dropdown */}
          {!user ? (
            <Link
              href={loginHref}
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Log in
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white ring-2 ring-transparent transition hover:ring-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Account menu"
              >
                {avatarLetter}
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-lg border border-white/15 bg-black/80 shadow-xl backdrop-blur-lg"
                  role="menu"
                >
                  <div className="border-b border-white/10 px-4 py-2.5">
                    <p className="truncate text-xs text-white/50">
                      {user.email ?? "Account"}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-4 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Orders
                  </Link>
                  <Link
                    href="/settings/profile"
                    className="block px-4 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Settings / Profile
                  </Link>
                  <div className="border-t border-white/10" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="block w-full px-4 py-2.5 text-left text-sm text-white/50 transition-colors hover:bg-white/10 disabled:opacity-50"
                    role="menuitem"
                  >
                    {loggingOut ? "Logging out\u2026" : "Log out"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hamburger — visible below md */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile navigation drawer ── */}
      {mobileOpen && (
        <nav
          className="border-t border-white/10 bg-black/70 backdrop-blur-lg md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={isActive(href) ? PILL_ACTIVE : PILL}
                aria-current={isActive(href) ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
