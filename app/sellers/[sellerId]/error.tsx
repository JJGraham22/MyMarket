"use client";

import { useEffect } from "react";
import { Button } from "@/app/components/ui";

interface SellerProfileErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SellerProfileError({ error, reset }: SellerProfileErrorProps) {
  useEffect(() => {
    console.error("Seller profile error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-xl font-semibold text-[var(--cream)]">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-[var(--cream-muted)]">
        We couldn’t load this seller’s profile. Please try again.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
