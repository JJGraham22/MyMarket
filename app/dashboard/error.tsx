"use client";

import { useEffect } from "react";
import { Button } from "@/app/components/ui";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-xl font-semibold text-[var(--cream)]">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-[var(--cream-muted)]">
        We couldn’t load your dashboard. Please try again.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
