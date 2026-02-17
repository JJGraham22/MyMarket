import type { ReactNode } from "react";

type BadgeVariant = "success" | "neutral" | "warning" | "error";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success:
    "bg-[var(--green-bg)] text-[var(--green-pale)] border border-[rgba(107,158,58,0.3)]",
  neutral: "bg-[var(--brown-bg)] text-[var(--cream-muted)]",
  warning: "bg-[var(--market-orange-bg)] text-[var(--market-orange-soft)]",
  error: "bg-red-900/20 text-red-300 border border-red-500/30",
};

export function Badge({
  children,
  variant = "success",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium ${variantStyles[variant]} ${className}`.trim()}
      role="status"
    >
      {children}
    </span>
  );
}
