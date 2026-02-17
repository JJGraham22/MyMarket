import Link from "next/link";
import { Button } from "@/app/components/ui";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-2xl font-bold text-[var(--cream)]">Page not found</h1>
      <p className="mt-2 max-w-md text-[var(--cream-muted)]">
        The market, seller, or order you’re looking for doesn’t exist or has been removed.
      </p>
      <Link href="/markets" className="mt-8">
        <Button>Back to Markets</Button>
      </Link>
    </div>
  );
}
