"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

interface NavbarUser { id: string; email: string | null; }
interface NavbarProps { user: NavbarUser | null; }

const NAV_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/search",  label: "Search"  },
  { href: "/orders",  label: "Orders"  },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const loginHref = "/auth?next=" + encodeURIComponent(pathname || "/");
  const avatarLetter = (user?.email?.charAt(0) ?? "?").toUpperCase();

  return (
    <header
      style={{ background: "var(--forest)", fontFamily: "'DM Sans', sans-serif" }}
      className="sticky top-0 z-50 w-full"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-nowrap items-center justify-between px-6 py-3.5">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}
          >
            🌿
          </div>
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700, fontSize: "1.125rem", color: "#fff", letterSpacing: "-0.01em",
          }}>
            My Market
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: 9999,
                fontSize: "0.9rem",
                fontWeight: isActive(href) ? 600 : 400,
                color: isActive(href) ? "#fff" : "rgba(255,255,255,0.75)",
                background: isActive(href) ? "rgba(255,255,255,0.15)" : "transparent",
                transition: "background 0.2s, color 0.2s",
              }}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: Profile icon + hamburger */}
        <div className="flex shrink-0 items-center gap-2.5">
          {/* Profile Icon - Always visible in top right */}
          <div className="relative" ref={dropdownRef}>
            {!user ? (
              <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "2px solid rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                }}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Account menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 20, height: 20 }}>
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff", fontWeight: 600, fontSize: "0.875rem",
                  border: "2px solid rgba(255,255,255,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Account menu"
              >
                {avatarLetter}
              </button>
            )}

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                style={{
                  position: "absolute", right: 0, top: "calc(100% + 10px)",
                  minWidth: 220, borderRadius: 12,
                  background: "#fff", border: "1px solid rgba(26,66,49,0.15)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  overflow: "hidden", zIndex: 50,
                }}
                role="menu"
              >
                {user ? (
                  <>
                    {/* User info header */}
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(26,66,49,0.1)", background: "rgba(74,155,107,0.05)" }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1a4231", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email ?? "Account"}
                      </p>
                    </div>
                    
                    {/* Profile Settings */}
                    <Link
                      href="/settings/profile"
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", fontSize: "0.875rem", color: "#2a2218", transition: "background 0.15s", fontWeight: 500 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,155,107,0.1)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                      Profile Settings
                    </Link>

                    {/* Other menu items */}
                    {[
                      { href: "/dashboard", label: "Dashboard", icon: "📊" },
                      { href: "/orders", label: "My Orders", icon: "📦" },
                      { href: "/settings/payments", label: "Payments", icon: "💳" },
                      { href: "/seller/checkout", label: "Seller Checkout", icon: "🛒" },
                    ].map(({ href, label, icon }) => (
                      <Link
                        key={href}
                        href={href}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", fontSize: "0.875rem", color: "#2a2218", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,155,107,0.1)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span style={{ fontSize: "1rem" }}>{icon}</span>
                        {label}
                      </Link>
                    ))}
                    
                    {/* Logout */}
                    <div style={{ borderTop: "1px solid rgba(26,66,49,0.1)", marginTop: "4px" }} />
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "12px 16px",
                        textAlign: "left", fontSize: "0.875rem", color: "#dc2626",
                        background: "transparent", border: "none", cursor: "pointer",
                        transition: "background 0.15s", fontWeight: 500,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(220,38,38,0.1)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      role="menuitem"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 100-2H4V4h7a1 1 0 100-2H3z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M13.293 4.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L15.586 10H8a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {loggingOut ? "Logging out…" : "Log out"}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Not logged in - show login option */}
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(26,66,49,0.1)" }}>
                      <p style={{ fontSize: "0.8125rem", color: "var(--cream-muted)", margin: 0 }}>
                        Sign in to access your account
                      </p>
                    </div>
                    <Link
                      href={loginHref}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", fontSize: "0.875rem", color: "#fff", background: "var(--forest)", transition: "background 0.15s", fontWeight: 600 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--forest-mid)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "var(--forest)")}
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      Log in
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(o => !o)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              border: "1.5px solid rgba(255,255,255,0.25)",
              color: "#fff", background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            className="md:hidden"
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{width:18,height:18}}>
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{width:18,height:18}}>
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav style={{ background: "var(--forest-mid)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-3">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "0.6rem 1rem", borderRadius: 9999,
                  fontSize: "0.9rem", fontWeight: isActive(href) ? 600 : 400,
                  color: "#fff",
                  background: isActive(href) ? "rgba(255,255,255,0.15)" : "transparent",
                }}
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
