import type { ReactNode } from "react";

interface EmptyStateProps {
  message: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ message, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={
        "rounded-xl border border-[rgba(168,137,104,0.2)] bg-[var(--ground-elevated)] px-6 py-10 text-center " +
        (className || "").trim()
      }
      role="status"
    >
      <p className="text-sm text-[var(--cream-muted)]">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
