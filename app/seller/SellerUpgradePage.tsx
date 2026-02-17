import Link from "next/link";
import { PageHeader, Card, Button } from "@/app/components/ui";

/**
 * Shown when a logged-in buyer tries to access a seller-only page.
 */
export function SellerUpgradePage() {
  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      <PageHeader
        title="Seller access"
        subtitle="This area is for sellers. Switch your account to a seller to manage checkout and listings."
        className="text-center"
      />
      <Card padding="lg" className="p-6 sm:p-8 text-center">
        <p className="text-sm text-[var(--cream-muted)]">
          Want to sell at a market? You’ll need a seller account. Contact the market organiser or switch your profile to seller to get started.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
          <Link href="/markets">
            <Button variant="ghost">Browse markets</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
