import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
  children?: ReactNode;
  light?: boolean;
}

export function PageHeader({ title, subtitle, label, children, light = false }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <p style={{
          color: light ? "rgba(255,255,255,0.7)" : "var(--forest)",
          fontWeight: 600, fontSize: "0.8125rem",
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {label}
        </p>
      )}
      <h1 className={light ? "page-heading-light" : "page-heading"}>{title}</h1>
      {subtitle && <p className="page-subheading" style={{ color: light ? "rgba(255,255,255,0.65)" : undefined }}>{subtitle}</p>}
      {children}
    </div>
  );
}
