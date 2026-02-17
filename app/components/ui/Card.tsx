import type { ReactNode } from "react";

type CardVariant = "default" | "clickable" | "bordered";

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  as?: "div" | "section" | "article";
}

const paddingMap = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  as: Component = "div",
}: CardProps) {
  const base = "rounded-xl border bg-[var(--ground-elevated)]";
  const variants = {
    default: "border-[rgba(168,137,104,0.2)]",
    clickable:
      "card-btn border-2 border-[var(--green-soft)] cursor-pointer transition-all",
    bordered: "border-[rgba(168,137,104,0.25)]",
  };
  const classes = `${base} ${variants[variant]} ${paddingMap[padding]} ${className}`.trim();
  return <Component className={classes}>{children}</Component>;
}

interface CardCTAProps {
  children: ReactNode;
  className?: string;
}

export function CardCTA({ children, className = "" }: CardCTAProps) {
  return (
    <span className={`card-btn-cta mt-4 inline-flex ${className}`.trim()}>
      {children}
    </span>
  );
}
