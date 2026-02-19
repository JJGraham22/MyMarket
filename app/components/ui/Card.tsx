import type { ReactNode } from "react";

type CardVariant = "default" | "clickable" | "bordered";

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  as?: "div" | "section" | "article";
}

const paddingMap = { none: "p-0", sm: "p-4", md: "p-6", lg: "p-8" };

export function Card({ children, variant = "default", padding = "md", className = "", as: Component = "div" }: CardProps) {
  const base = "rounded-2xl";
  const variants = {
    default:   "card",
    clickable: "card card-btn",
    bordered:  "card",
  };
  return (
    <Component className={`${base} ${variants[variant]} ${paddingMap[padding]} ${className}`.trim()}>
      {children}
    </Component>
  );
}

interface CardCTAProps { children: ReactNode; className?: string; }
export function CardCTA({ children, className = "" }: CardCTAProps) {
  return (
    <span className={`card-btn-cta mt-4 inline-flex ${className}`.trim()}>
      {children}
    </span>
  );
}
