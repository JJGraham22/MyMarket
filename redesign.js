/**
 * MyMarket — Complete UI Redesign
 * Run from project root: node redesign.js
 */

const fs = require("fs");
const path = require("path");

function write(relPath, content) {
  const abs = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
  console.log("✓", relPath);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GLOBALS.CSS — New design system
// ─────────────────────────────────────────────────────────────────────────────
write("app/globals.css", `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  /* Layout */
  --container-max: 72rem;
  --container-padding: 1.5rem;

  /* ── Forest greens (primary brand) ── */
  --forest:        #1a4231;
  --forest-mid:    #235c43;
  --forest-light:  #2d7a57;
  --leaf:          #4a9b6b;
  --sage:          #8fbc9a;
  --sage-pale:     #c4deca;
  --sage-bg:       rgba(74, 155, 107, 0.12);

  /* ── Legacy aliases (keep for existing pages) ── */
  --green-deep:    #1a4231;
  --green-mid:     #235c43;
  --green-soft:    #4a9b6b;
  --green-pale:    #8fbc9a;
  --green-bright:  #c4deca;
  --green-bg:      rgba(74, 155, 107, 0.15);

  /* ── Warm market tones ── */
  --market-red:        #c53c3c;
  --market-red-soft:   #e06565;
  --market-red-bg:     rgba(197, 60, 60, 0.12);
  --market-orange:     #e07c2e;
  --market-orange-soft:#f0a050;
  --market-orange-bg:  rgba(224, 124, 46, 0.10);

  /* ── Wood & earth ── */
  --brown-deep: #3d3229;
  --brown-mid:  #5c4033;
  --brown-warm: #b8860b;
  --brown-soft: #a08968;
  --brown-bg:   rgba(92, 64, 51, 0.15);

  /* ── Light / cream surfaces (browsing pages) ── */
  --cream-page:   #f5f0e8;
  --cream-card:   #fdfaf5;
  --cream:        #f5f0e8;
  --cream-muted:  #7a6e5f;

  /* ── Dark surfaces (tool pages: checkout, settings) ── */
  --ground:          #0f1a0e;
  --ground-elevated: #182316;

  /* ── Spacing ── */
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-14: 3.5rem;
}

*, *::before, *::after { box-sizing: border-box; }

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  background: var(--cream-page);
  color: #2a2218;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }
button { font: inherit; }

/* ── Typography ── */
.font-display {
  font-family: 'Playfair Display', Georgia, serif;
}

.page-heading {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: #1a1a12;
}

.page-heading-light {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: #fff;
}

.page-subheading {
  font-size: 1.0625rem;
  font-weight: 400;
  color: var(--cream-muted);
  margin-top: 0.625rem;
  max-width: 48ch;
  line-height: 1.65;
}

.section-heading {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.375rem;
  font-weight: 700;
  color: #1a1a12;
  letter-spacing: -0.01em;
}

.section-heading-light {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.375rem;
  font-weight: 700;
  color: #fff;
}

/* ── Buttons — pill style ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 9999px;
  padding: 0.7rem 1.6rem;
  border: none;
  cursor: pointer;
  background: var(--forest);
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 0.9375rem;
  letter-spacing: 0.01em;
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
}
.btn-primary:hover {
  background: var(--forest-mid);
  box-shadow: 0 4px 16px rgba(26, 66, 49, 0.25);
  transform: translateY(-1px);
}
.btn-primary:active { transform: translateY(0); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 9999px;
  padding: 0.65rem 1.5rem;
  border: 1.5px solid var(--forest);
  background: transparent;
  color: var(--forest);
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 0.9375rem;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
}
.btn-secondary:hover {
  background: var(--forest);
  color: #fff;
  box-shadow: 0 4px 16px rgba(26, 66, 49, 0.2);
  transform: translateY(-1px);
}
.btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }

/* Secondary on dark surfaces */
.btn-secondary-light {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 9999px;
  padding: 0.65rem 1.5rem;
  border: 1.5px solid rgba(255,255,255,0.6);
  background: transparent;
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 0.9375rem;
  transition: background 0.2s, border-color 0.2s;
}
.btn-secondary-light:hover {
  background: rgba(255,255,255,0.15);
  border-color: #fff;
}

.btn-remove {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(197, 60, 60, 0.1);
  color: #c53c3c;
  border: 1px solid rgba(197, 60, 60, 0.3);
  cursor: pointer;
  transition: background 0.2s;
}
.btn-remove:hover { background: rgba(197, 60, 60, 0.2); }

/* ── Cards ── */
/* Light card — used on cream pages */
.card {
  border-radius: 1rem;
  border: 1px solid rgba(26, 66, 49, 0.1);
  background: var(--cream-card);
  box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04);
  padding: 1.5rem;
}

/* Dark card — used on dark tool pages */
.card-dark {
  border-radius: 1rem;
  border: 1px solid rgba(168, 137, 104, 0.2);
  background: var(--ground-elevated);
  padding: 1.5rem;
}

.card-organic {
  border-radius: 1rem;
  border: 1px solid rgba(26, 66, 49, 0.1);
  background: var(--cream-card);
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

/* On dark pages, card-organic needs dark treatment */
.dark-surface .card-organic {
  background: var(--ground-elevated);
  border-color: rgba(168, 137, 104, 0.2);
  box-shadow: none;
}

.dark-surface .card {
  background: var(--ground-elevated);
  border-color: rgba(168, 137, 104, 0.2);
  box-shadow: none;
}

/* Clickable card */
.card-btn {
  cursor: pointer;
  border: 1.5px solid var(--sage);
  background: var(--cream-card);
  box-shadow: 0 2px 8px rgba(26, 66, 49, 0.06);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}
.card-btn:hover {
  border-color: var(--forest);
  box-shadow: 0 4px 20px rgba(26, 66, 49, 0.12);
  transform: translateY(-2px);
}

.card-btn-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 1rem;
  padding: 0.5rem 1.25rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.9rem;
  background: var(--forest);
  color: #fff;
  border: none;
  transition: background 0.2s;
}
.card-btn:hover .card-btn-cta { background: var(--forest-mid); }

/* ── Forest section (deep green feature areas) ── */
.section-forest {
  background: var(--forest);
  color: #fff;
  border-radius: 1.25rem;
}

/* ── Forms ── */
.input {
  width: 100%;
  border-radius: 0.625rem;
  border: 1.5px solid rgba(26, 66, 49, 0.2);
  background: #fff;
  color: #2a2218;
  padding: 0.65rem 1rem;
  outline: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9375rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input:focus {
  border-color: var(--forest-light);
  box-shadow: 0 0 0 3px rgba(74, 155, 107, 0.15);
}

/* Input on dark pages */
.dark-surface .input {
  background: rgba(37, 34, 25, 0.8);
  border-color: rgba(168, 137, 104, 0.35);
  color: var(--cream);
}
.dark-surface .input:focus {
  border-color: var(--green-soft);
  box-shadow: 0 0 0 2px var(--green-bg);
}

/* ── Pills / tags ── */
.pill {
  border-radius: 9999px;
  padding: 0.3rem 0.85rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1.5px solid rgba(26, 66, 49, 0.2);
  background: rgba(74, 155, 107, 0.06);
  color: var(--forest);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.pill:hover { background: rgba(74, 155, 107, 0.12); }
.pill-active {
  border-color: var(--forest);
  background: var(--forest);
  color: #fff;
}

.badge-soft {
  border-radius: 9999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: rgba(74, 155, 107, 0.12);
  color: var(--forest);
}

/* ── Link button ── */
.link-button {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.9rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
  background: var(--forest);
  color: #fff;
  text-decoration: none;
  transition: background 0.2s;
}
.link-button:hover { background: var(--forest-mid); color: #fff; }

/* ── Container ── */
.container {
  width: 100%;
  max-width: var(--container-max);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--container-padding);
  padding-right: var(--container-padding);
}

/* Full-bleed helper: break out of any container */
.full-bleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
}

/* ── Grid ── */
.grid { display: grid; gap: var(--space-4); }
.grid-2 { grid-template-columns: minmax(0, 2.1fr) minmax(0, 1.4fr); }
@media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }

/* ── Table ── */
.table-head {
  border-bottom: 1px solid rgba(26, 66, 49, 0.12);
  background: rgba(74, 155, 107, 0.06);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--forest);
  font-weight: 600;
}

/* ── Dark surface wrapper — wraps tool pages ── */
.dark-surface {
  background: var(--ground);
  color: var(--cream);
  min-height: 100vh;
}

.dark-surface .page-heading {
  color: var(--cream) !important;
}
.dark-surface .page-subheading {
  color: var(--cream-muted) !important;
}
.dark-surface .section-heading {
  color: var(--cream) !important;
  font-family: 'DM Sans', sans-serif;
}
.dark-surface a:hover { color: var(--cream); }

/* ── Divider ── */
.divider {
  border: none;
  border-top: 1px solid rgba(26, 66, 49, 0.1);
  margin: 2rem 0;
}
`);

// ─────────────────────────────────────────────────────────────────────────────
// 2. APP/LAYOUT.TSX — Font + updated background
// ─────────────────────────────────────────────────────────────────────────────
write("app/layout.tsx", `import "./globals.css";
import type { ReactNode } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { AppUrlHandler } from "@/app/components/AppUrlHandler";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Market",
  description: "Find local farmers markets and fresh produce near you.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const navUser = user ? { id: user.id, email: user.email ?? null } : null;

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar user={navUser} />
        <AppUrlHandler />
        <main>{children}</main>
      </body>
    </html>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────
// 3. NAVBAR — Forest green, pill links
// ─────────────────────────────────────────────────────────────────────────────
write("components/Navbar.tsx", `"use client";

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

        {/* Right: auth + hamburger */}
        <div className="flex shrink-0 items-center gap-2.5">
          {!user ? (
            <Link
              href={loginHref}
              style={{
                padding: "0.45rem 1.1rem",
                borderRadius: 9999,
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--forest)",
                background: "#fff",
                transition: "opacity 0.2s",
              }}
            >
              Log in
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff", fontWeight: 700, fontSize: "0.9rem",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "background 0.2s",
                }}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Account menu"
              >
                {avatarLetter}
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    minWidth: 210, borderRadius: 12,
                    background: "#fff", border: "1px solid rgba(26,66,49,0.12)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    overflow: "hidden", zIndex: 50,
                  }}
                  role="menu"
                >
                  <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid rgba(26,66,49,0.08)" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--cream-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.email ?? "Account"}
                    </p>
                  </div>
                  {[
                    { href: "/dashboard",         label: "Dashboard"    },
                    { href: "/orders",             label: "My orders"    },
                    { href: "/settings/profile",   label: "Profile"      },
                    { href: "/settings/payments",  label: "Payments"     },
                    { href: "/seller/checkout",    label: "Seller checkout" },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      style={{ display: "block", padding: "10px 16px", fontSize: "0.875rem", color: "#2a2218", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,155,107,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(26,66,49,0.08)" }} />
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    style={{
                      display: "block", width: "100%", padding: "10px 16px",
                      textAlign: "left", fontSize: "0.875rem", color: "var(--cream-muted)",
                      background: "transparent", border: "none", cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,155,107,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    role="menuitem"
                  >
                    {loggingOut ? "Logging out…" : "Log out"}
                  </button>
                </div>
              )}
            </div>
          )}

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
`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. HOMEPAGE — Hero + feature sections
// ─────────────────────────────────────────────────────────────────────────────
write("app/page.tsx", `import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section
        style={{
          background: "linear-gradient(135deg, #0f2a1e 0%, #1a4231 40%, #235c43 70%, #0f2a1e 100%)",
          minHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          padding: "5rem 1.5rem 4rem",
        }}
      >
        {/* Botanical background pattern */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07, pointerEvents: "none" }}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="leaves" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <ellipse cx="20" cy="30" rx="14" ry="22" transform="rotate(-30 20 30)" fill="#8fbc9a"/>
              <ellipse cx="80" cy="10" rx="10" ry="18" transform="rotate(20 80 10)" fill="#8fbc9a"/>
              <ellipse cx="60" cy="80" rx="16" ry="26" transform="rotate(15 60 80)" fill="#8fbc9a"/>
              <ellipse cx="100" cy="60" rx="8" ry="14" transform="rotate(-45 100 60)" fill="#8fbc9a"/>
              <ellipse cx="10" cy="90" rx="12" ry="20" transform="rotate(50 10 90)" fill="#8fbc9a"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#leaves)"/>
        </svg>

        {/* Radial glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(74,155,107,0.15) 0%, transparent 70%)",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 680 }}>
          {/* Eyebrow */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(255,255,255,0.1)", borderRadius: 9999,
            padding: "0.35rem 1rem", marginBottom: "1.75rem",
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            <span style={{ fontSize: "0.9rem" }}>🌿</span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.8125rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Local Farmers Markets
            </span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            margin: "0 0 1.25rem",
          }}>
            Farm Fresh.<br/>
            <span style={{ color: "#93c9a8" }}>Local Market.</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "clamp(1rem, 2vw, 1.1875rem)",
            lineHeight: 1.65,
            maxWidth: 480,
            margin: "0 auto 2.5rem",
            fontWeight: 300,
          }}>
            Discover local farmers markets and fresh stalls near you, or run your own stall with built-in QR payments.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/markets"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.85rem 2rem", borderRadius: 9999,
                background: "#fff", color: "var(--forest)",
                fontWeight: 700, fontSize: "0.9375rem", fontFamily: "'DM Sans', sans-serif",
                transition: "transform 0.15s, box-shadow 0.2s",
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              }}
            >
              Browse Markets
              <span style={{ fontSize: "1.1rem" }}>→</span>
            </Link>
            <Link
              href="/seller/checkout"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.85rem 2rem", borderRadius: 9999,
                background: "transparent",
                border: "1.5px solid rgba(255,255,255,0.5)",
                color: "#fff",
                fontWeight: 600, fontSize: "0.9375rem", fontFamily: "'DM Sans', sans-serif",
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              Seller Checkout
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
          background: "linear-gradient(to bottom, transparent, var(--cream-page))",
          pointerEvents: "none",
        }} />
      </section>

      {/* ── How it works ── */}
      <section style={{ background: "var(--cream-page)", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ color: "var(--forest)", fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              How it works
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, color: "#1a1a12", margin: 0, letterSpacing: "-0.02em" }}>
              Your market, simplified
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {[
              { num: "01", tag: "For Buyers", icon: "🏪", title: "Find your market", body: "Browse local farmers markets, see who's selling today and what's available at each stall." },
              { num: "02", tag: "Scan & Pay",  icon: "📱", title: "Scan to order",    body: "Sellers generate a QR code at the stall. Scan it, review your items and pay instantly online." },
              { num: "03", tag: "For Sellers", icon: "💳", title: "Easy checkout",    body: "Manage your listings, create orders and accept payments by QR, card tap or Square Terminal." },
            ].map(({ num, tag, icon, title, body }) => (
              <div
                key={num}
                style={{
                  background: "var(--cream-card)", borderRadius: "1rem",
                  padding: "1.75rem",
                  border: "1px solid rgba(26,66,49,0.08)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "rgba(26,66,49,0.2)" }}>
                    {num}
                  </span>
                  <span style={{
                    background: "rgba(74,155,107,0.1)", borderRadius: 9999,
                    padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 600,
                    color: "var(--forest)", border: "1px solid rgba(74,155,107,0.2)",
                  }}>
                    {tag}
                  </span>
                </div>
                <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.1875rem", color: "#1a1a12", margin: "0 0 0.5rem" }}>
                  {title}
                </h3>
                <p style={{ color: "var(--cream-muted)", fontSize: "0.9rem", lineHeight: 1.65, margin: 0 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Forest feature section ── */}
      <section style={{ background: "var(--forest)", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "3rem", alignItems: "center" }}>
            <div>
              <p style={{ color: "var(--sage)", fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                For Sellers
              </p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, color: "#fff", margin: "0 0 1rem", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                Everything you need to run your stall
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 2rem", maxWidth: 420 }}>
                Manage listings, take payments in seconds via QR code, Square Terminal, or tap-to-pay reader. No hardware required to get started.
              </p>
              <Link
                href="/seller/checkout"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.8rem 1.75rem", borderRadius: 9999,
                  background: "#fff", color: "var(--forest)",
                  fontWeight: 700, fontSize: "0.9375rem", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Open Seller Checkout →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {[
                { icon: "📲", label: "QR Payments"        },
                { icon: "💳", label: "Card Reader"         },
                { icon: "🖥️", label: "Square Terminal"     },
                { icon: "📦", label: "Inventory Tracking"  },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.875rem",
                    padding: "1.25rem",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{icon}</div>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500, fontSize: "0.875rem", margin: 0 }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "var(--forest)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "2.5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <span style={{ fontSize: "1.25rem" }}>🌿</span>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, color: "#fff", fontSize: "1rem" }}>
              My Market
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8125rem", margin: 0 }}>
            © {new Date().getFullYear()} My Market. Local produce, local community.
          </p>
        </div>
      </footer>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────
// 5. MARKETS CLIENT — Cream cards
// ─────────────────────────────────────────────────────────────────────────────
write("app/markets/MarketsClient.tsx", `"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Market {
  id: string;
  name: string;
  city: string | null;
  suburb: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export function MarketsClient() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [openToday, setOpenToday] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)    params.set("search", search);
    if (city)      params.set("city", city);
    if (openToday) params.set("openToday", "true");
    const res = await fetch(\`/api/markets?\${params.toString()}\`);
    const data = await res.json();
    setMarkets(data.markets ?? []);
    setLoading(false);
  }, [search, city, openToday]);

  useEffect(() => {
    async function loadCities() {
      const res = await fetch("/api/markets");
      const data = await res.json();
      const all: Market[] = data.markets ?? [];
      const unique = Array.from(new Set(all.map(m => m.city).filter((c): c is string => Boolean(c)))).sort();
      setCities(unique);
    }
    loadCities();
  }, []);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  return (
    <div style={{ background: "var(--cream-page)", minHeight: "100vh", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ color: "var(--forest)", fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.5rem", margin: "0 0 0.5rem" }}>
            Discover
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 700, color: "#1a1a12", margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            Browse Markets
          </h1>
          <p style={{ color: "var(--cream-muted)", fontSize: "1rem", margin: 0 }}>
            Find local farmers markets and fresh produce near you.
          </p>
        </div>

        {/* Filters */}
        <div style={{
          background: "var(--cream-card)", borderRadius: "1rem",
          border: "1px solid rgba(26,66,49,0.08)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          padding: "1.25rem 1.5rem", marginBottom: "2rem",
          display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end",
        }}>
          <div style={{ flex: "1", minWidth: 200 }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--forest)", marginBottom: "0.4rem" }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Market name or suburb…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ minWidth: 140 }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--forest)", marginBottom: "0.4rem" }}>
              City
            </label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="input"
            >
              <option value="">All cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", paddingBottom: "0.65rem" }}>
            <input
              type="checkbox"
              checked={openToday}
              onChange={e => setOpenToday(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--forest)" }}
            />
            <span style={{ fontSize: "0.875rem", color: "#2a2218", fontWeight: 500 }}>Open today</span>
          </label>
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: "var(--cream-card)", borderRadius: "1rem", height: 140, border: "1px solid rgba(26,66,49,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : markets.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "4rem 2rem",
            background: "var(--cream-card)", borderRadius: "1rem",
            border: "1px solid rgba(26,66,49,0.08)",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🌾</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1a1a12", margin: "0 0 0.5rem" }}>No markets found</h3>
            <p style={{ color: "var(--cream-muted)", margin: 0 }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              {markets.length} market{markets.length !== 1 ? "s" : ""} found
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {markets.map(market => (
                <Link
                  key={market.id}
                  href={\`/markets/\${market.id}\`}
                  style={{
                    background: "var(--cream-card)",
                    borderRadius: "1rem",
                    border: "1px solid rgba(26,66,49,0.08)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    padding: "1.5rem",
                    display: "block",
                    transition: "transform 0.15s, box-shadow 0.2s, border-color 0.2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(26,66,49,0.1)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,155,107,0.4)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,66,49,0.08)";
                  }}
                >
                  {/* Placeholder image area */}
                  <div style={{
                    height: 100, borderRadius: "0.625rem", marginBottom: "1rem",
                    background: "linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "2rem",
                  }}>
                    🏪
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.125rem", color: "#1a1a12", margin: "0 0 0.375rem" }}>
                    {market.name}
                  </h3>
                  {(market.suburb || market.city) && (
                    <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem", margin: "0 0 1rem" }}>
                      📍 {[market.suburb, market.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <span style={{ color: "var(--forest)", fontWeight: 600, fontSize: "0.875rem" }}>
                    View stalls →
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────
// 6. BUYER DASHBOARD — Cream layout
// ─────────────────────────────────────────────────────────────────────────────
write("app/dashboard/BuyerDashboard.tsx", `"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { Badge } from "@/app/components/ui";

interface Order {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
}

interface SavedMarket {
  market_id: string;
  markets: { id: string; name: string; city: string | null; suburb: string | null } | null;
}

interface SavedSeller {
  seller_id: string;
  profiles: { id: string; display_name: string | null } | null;
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "PAID" || status === "COMPLETED" ? "success" : "neutral";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}

export function BuyerDashboard({ displayName, userId }: { displayName: string | null; userId: string }) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedMarkets, setSavedMarkets] = useState<SavedMarket[]>([]);
  const [savedSellers, setSavedSellers] = useState<SavedSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);
  const [switchingToSeller, setSwitchingToSeller] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase
        .from("orders").select("id, status, total_cents, created_at")
        .eq("customer_id", userId).order("created_at", { ascending: false }).limit(10);
      setOrders(data ?? []);
      setLoading(false);
    }
    fetchOrders();
  }, [userId]);

  useEffect(() => {
    async function fetchSaved() {
      const supabase = createBrowserSupabaseClient();
      const [marketsRes, sellersRes] = await Promise.all([
        supabase.from("saved_markets").select("market_id, markets(id, name, city, suburb)").eq("user_id", userId),
        supabase.from("saved_sellers").select("seller_id, profiles(id, display_name)").eq("user_id", userId),
      ]);
      setSavedMarkets((marketsRes.data ?? []) as unknown as SavedMarket[]);
      setSavedSellers((sellersRes.data ?? []) as unknown as SavedSeller[]);
      setSavedLoading(false);
    }
    fetchSaved();
  }, [userId]);

  async function switchToSeller() {
    setSwitchingToSeller(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("profiles").update({ role: "seller" }).eq("id", userId);
    setSwitchingToSeller(false);
    if (!error) router.refresh();
  }

  const greeting = displayName ?? "there";

  return (
    <div style={{ background: "var(--cream-page)", minHeight: "100vh", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, color: "#1a1a12", margin: "0 0 0.375rem", letterSpacing: "-0.02em" }}>
            Hey, {greeting}! 👋
          </h1>
          <p style={{ color: "var(--cream-muted)", fontSize: "1rem", margin: 0 }}>
            Discover local markets, browse fresh produce, and track your orders.
          </p>
        </div>

        {/* Switch to seller banner */}
        <div style={{
          background: "var(--forest)", borderRadius: "1rem", padding: "1.5rem",
          marginBottom: "2rem", display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between", gap: "1rem",
        }}>
          <div>
            <p style={{ color: "#fff", fontWeight: 600, margin: "0 0 0.25rem" }}>Sell at markets?</p>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", margin: 0 }}>
              Switch to a seller account to manage listings and accept payments.
            </p>
          </div>
          <button
            type="button"
            onClick={switchToSeller}
            disabled={switchingToSeller}
            style={{
              padding: "0.65rem 1.5rem", borderRadius: 9999,
              background: "#fff", color: "var(--forest)",
              fontWeight: 700, fontSize: "0.9rem", fontFamily: "'DM Sans', sans-serif",
              border: "none", cursor: "pointer",
              opacity: switchingToSeller ? 0.6 : 1,
            }}
          >
            {switchingToSeller ? "Switching…" : "Switch to Seller →"}
          </button>
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
          {[
            { href: "/markets", icon: "🏪", title: "Find Markets",  desc: "Browse farmers markets near you.", cta: "Explore →" },
            { href: "/orders",  icon: "📦", title: "My Orders",     desc: "View your order history.",          cta: "View orders →" },
            { href: "/search",  icon: "🔍", title: "Search",        desc: "Search markets and sellers.",       cta: "Search →" },
          ].map(({ href, icon, title, desc, cta }) => (
            <Link
              key={href}
              href={href}
              style={{
                background: "var(--cream-card)", borderRadius: "1rem",
                border: "1px solid rgba(26,66,49,0.08)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                padding: "1.5rem", textDecoration: "none",
                display: "block", transition: "transform 0.15s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(26,66,49,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }}
            >
              <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{icon}</div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.125rem", color: "#1a1a12", margin: "0 0 0.375rem" }}>{title}</h3>
              <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem", margin: "0 0 1rem", lineHeight: 1.5 }}>{desc}</p>
              <span style={{ color: "var(--forest)", fontWeight: 600, fontSize: "0.875rem" }}>{cta}</span>
            </Link>
          ))}
        </div>

        {/* Saved + Orders */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>

          {/* Saved Markets */}
          <div style={{ background: "var(--cream-card)", borderRadius: "1rem", border: "1px solid rgba(26,66,49,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: "1.5rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.125rem", color: "#1a1a12", margin: "0 0 1rem" }}>Saved Markets</h2>
            {savedLoading ? (
              <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>Loading…</p>
            ) : savedMarkets.length === 0 ? (
              <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>No saved markets yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {savedMarkets.map(sm => {
                  const m = sm.markets;
                  const id = m?.id ?? sm.market_id;
                  const name = m?.name ?? "Market";
                  const loc = [m?.suburb, m?.city].filter(Boolean).join(", ");
                  return (
                    <li key={sm.market_id}>
                      <Link href={"/markets/" + id} style={{
                        display: "block", padding: "0.625rem 0.875rem", borderRadius: "0.625rem",
                        background: "rgba(74,155,107,0.06)", border: "1px solid rgba(74,155,107,0.12)",
                        transition: "background 0.15s",
                      }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1a1a12" }}>{name}</span>
                        {loc && <span style={{ marginLeft: "0.5rem", color: "var(--cream-muted)", fontSize: "0.8125rem" }}>· {loc}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Saved Sellers */}
          <div style={{ background: "var(--cream-card)", borderRadius: "1rem", border: "1px solid rgba(26,66,49,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: "1.5rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.125rem", color: "#1a1a12", margin: "0 0 1rem" }}>Saved Sellers</h2>
            {savedLoading ? (
              <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>Loading…</p>
            ) : savedSellers.length === 0 ? (
              <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>No saved sellers yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {savedSellers.map(ss => {
                  const p = ss.profiles;
                  const id = p?.id ?? ss.seller_id;
                  const name = p?.display_name ?? "Seller";
                  return (
                    <li key={ss.seller_id}>
                      <Link href={"/sellers/" + id} style={{
                        display: "block", padding: "0.625rem 0.875rem", borderRadius: "0.625rem",
                        background: "rgba(74,155,107,0.06)", border: "1px solid rgba(74,155,107,0.12)",
                        transition: "background 0.15s",
                      }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1a1a12" }}>{name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div style={{ background: "var(--cream-card)", borderRadius: "1rem", border: "1px solid rgba(26,66,49,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: "1.5rem", marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.125rem", color: "#1a1a12", margin: 0 }}>Recent Orders</h2>
            <Link href="/orders" style={{ color: "var(--forest)", fontWeight: 600, fontSize: "0.875rem" }}>View all →</Link>
          </div>
          {loading ? (
            <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>Loading…</p>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <p style={{ color: "var(--cream-muted)", margin: "0 0 1rem" }}>No orders yet.</p>
              <Link href="/markets" className="btn-primary" style={{ display: "inline-flex" }}>Browse markets</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(26,66,49,0.08)" }}>
                    {["Order", "Status", "Total", "Date"].map(h => (
                      <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: h === "Total" || h === "Date" ? "right" : "left", color: "var(--forest)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: "1px solid rgba(26,66,49,0.06)" }}>
                      <td style={{ padding: "0.75rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#2a2218" }}>{order.id.slice(0,8)}…</td>
                      <td style={{ padding: "0.75rem" }}><StatusBadge status={order.status} /></td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, color: "#1a1a12" }}>\${(order.total_cents / 100).toFixed(2)}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", color: "var(--cream-muted)" }}>{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────
// 7. UI COMPONENTS — Pill Button + Light Card
// ─────────────────────────────────────────────────────────────────────────────
write("app/components/ui/Button.tsx", `import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "remove" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "btn-primary",
  secondary: "btn-secondary",
  remove:    "btn-remove",
  ghost:     "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold border border-transparent text-[var(--forest)] hover:bg-[var(--sage-bg)] transition-all",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

export function Button(props: ButtonProps) {
  const { children, variant = "primary", className = "", type = "button", ...rest } = props;
  const base = "inline-flex items-center justify-center gap-2 font-semibold text-[0.9375rem] transition-all disabled:opacity-55 disabled:cursor-not-allowed";
  return (
    <button type={type} className={\`\${base} \${variantClasses[variant]} \${className}\`.trim()} {...rest}>
      {children}
    </button>
  );
}
`);

write("app/components/ui/Card.tsx", `import type { ReactNode } from "react";

type CardVariant = "default" | "clickable" | "bordered";

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  as?: "div" | "section" | "article";
}

const paddingMap = { none: "p-0", sm: "p-4", md: "p-6", lg: "p-8" };

export function Card({ children, variant = "default", padding = "md", className = "", as: Component = "div" }: CardProps) {
  const base = "rounded-2xl";
  const variants = {
    default:   "card",
    clickable: "card card-btn",
    bordered:  "card",
  };
  return (
    <Component className={\`\${base} \${variants[variant]} \${paddingMap[padding]} \${className}\`.trim()}>
      {children}
    </Component>
  );
}

interface CardCTAProps { children: ReactNode; className?: string; }
export function CardCTA({ children, className = "" }: CardCTAProps) {
  return (
    <span className={\`card-btn-cta mt-4 inline-flex \${className}\`.trim()}>
      {children}
    </span>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────
// 8. PAGE HEADER — Updated for light pages
// ─────────────────────────────────────────────────────────────────────────────
write("app/components/ui/PageHeader.tsx", `import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
  children?: ReactNode;
  light?: boolean;
}

export function PageHeader({ title, subtitle, label, children, light = false }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <p style={{
          color: light ? "rgba(255,255,255,0.7)" : "var(--forest)",
          fontWeight: 600, fontSize: "0.8125rem",
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {label}
        </p>
      )}
      <h1 className={light ? "page-heading-light" : "page-heading"}>{title}</h1>
      {subtitle && <p className="page-subheading" style={{ color: light ? "rgba(255,255,255,0.65)" : undefined }}>{subtitle}</p>}
      {children}
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────
// 9. BADGE — Updated colors
// ─────────────────────────────────────────────────────────────────────────────
write("app/components/ui/Badge.tsx", `import type { ReactNode } from "react";

type BadgeVariant = "success" | "neutral" | "warning" | "error";

const styles: Record<BadgeVariant, { background: string; color: string; border: string }> = {
  success: { background: "rgba(74,155,107,0.12)", color: "var(--forest)",       border: "rgba(74,155,107,0.3)"  },
  neutral: { background: "rgba(26,66,49,0.07)",   color: "var(--cream-muted)",  border: "rgba(26,66,49,0.15)"   },
  warning: { background: "rgba(224,124,46,0.1)",   color: "#b86010",            border: "rgba(224,124,46,0.25)" },
  error:   { background: "rgba(197,60,60,0.1)",    color: "#c53c3c",            border: "rgba(197,60,60,0.25)"  },
};

interface BadgeProps { children: ReactNode; variant?: BadgeVariant; }

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  const s = styles[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "0.2rem 0.65rem", borderRadius: 9999,
      fontSize: "0.75rem", fontWeight: 600,
      background: s.background, color: s.color,
      border: \`1px solid \${s.border}\`,
    }}>
      {children}
    </span>
  );
}
`);

console.log("\n✅ Redesign complete! All files written.\n");
console.log("Next steps:");
console.log("  1. Commit and push: git add . && git commit -m 'redesign: forest green + cream + pill UI' && git push");
console.log("  2. Run locally: npm run dev");
