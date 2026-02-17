import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
  className?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, label, className = "", children }: PageHeaderProps) {
  return (
    <header className={"space-y-3 " + (className || "").trim()} aria-label="Page header">
      {label ? (
        <p className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--market-red)" }}>
          {label}
        </p>
      ) : null}
      <h1 className="page-heading">{title}</h1>
      {subtitle ? <p className="page-subheading">{subtitle}</p> : null}
      {children}
    </header>
  );
}
