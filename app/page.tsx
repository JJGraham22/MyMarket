import Link from "next/link";
import { PageHeader, Card, Button } from "@/app/components/ui";

export default function HomePage() {
  return (
    <div className="space-y-20 text-center" style={{ color: "var(--cream)" }}>
      {/* Full-width section so logo is centered on the page */}
      <header className="flex w-full flex-col items-center pt-4">
        <div
          className="mb-6 flex justify-center rounded-2xl p-4"
          style={{
            background: "var(--ground)",
            width: 260,
            height: 260,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/market-logo.png"
            alt="My Market"
            width={240}
            height={240}
            className="max-h-64 w-auto max-w-[240px] object-contain sm:max-h-72"
          />
        </div>
        <div className="mx-auto max-w-3xl px-4">
          <PageHeader
            label="My Market"
            title="Local farmers markets. Real stalls. Simple payments."
            subtitle="Find markets and sellers near you, or run your stall with our seller checkout and QR payments."
          />
        </div>
      </header>

      <section className="mx-auto max-w-3xl space-y-6 px-4" style={{ color: "var(--cream)" }}>
        <h2 className="section-heading" style={{ color: "var(--cream)" }}>Get started</h2>
        <div className="grid justify-items-center gap-6 sm:grid-cols-2 sm:justify-items-stretch">
          <Card padding="md">
            <h3 className="text-lg font-semibold text-[var(--cream)]">
              Browse markets
            </h3>
            <p className="mt-2 text-sm text-[var(--cream-muted)]">
              Find local farmers markets and see who’s selling.
            </p>
            <Link href="/markets" className="mt-4 inline-block">
              <Button>Find markets</Button>
            </Link>
          </Card>
          <Card padding="md">
            <h3 className="text-lg font-semibold text-[var(--cream)]">
              Seller checkout
            </h3>
            <p className="mt-2 text-sm text-[var(--cream-muted)]">
              Run your stall: add items, create orders, take payment by QR.
            </p>
            <Link href="/seller/checkout" className="mt-4 inline-block">
              <Button>Open seller checkout</Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
