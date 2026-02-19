import Link from "next/link";

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
