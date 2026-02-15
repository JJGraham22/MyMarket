import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-20">
      <header className="space-y-6 pt-4">
        <p
          className="text-sm font-medium uppercase tracking-wider"
          style={{ color: "var(--market-red)" }}
        >
          My Market
        </p>
        <h1 className="page-heading">
          Local farmers markets. Real stalls. Simple payments.
        </h1>
        <p className="page-subheading">
          Find markets and sellers near you, or run your stall with our seller
          checkout and QR payments.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="section-heading">Get started</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="card-organic p-6">
            <h3 className="text-lg font-semibold text-[var(--cream)]">
              Browse markets
            </h3>
            <p className="mt-2 text-sm text-[var(--cream-muted)]">
              Find local farmers markets and see who’s selling.
            </p>
            <Link href="/markets" className="mt-4 inline-block">
              <button type="button" className="btn-primary">
                Find markets
              </button>
            </Link>
          </div>
          <div className="card-organic p-6">
            <h3 className="text-lg font-semibold text-[var(--cream)]">
              Seller checkout
            </h3>
            <p className="mt-2 text-sm text-[var(--cream-muted)]">
              Run your stall: add items, create orders, take payment by QR.
            </p>
            <Link href="/seller/checkout" className="mt-4 inline-block">
              <button type="button" className="btn-primary">
                Open seller checkout
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
