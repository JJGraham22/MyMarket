import type { ReactNode } from "react";

type BadgeVariant = "success" | "neutral" | "warning" | "error";

const styles: Record<BadgeVariant, { background: string; color: string; border: string }> = {
  success: { background: "rgba(74,155,107,0.12)", color: "var(--forest)",       border: "rgba(74,155,107,0.3)"  },
  neutral: { background: "rgba(26,66,49,0.07)",   color: "var(--cream-muted)",  border: "rgba(26,66,49,0.15)"   },
  warning: { background: "rgba(224,124,46,0.1)",   color: "#b86010",            border: "rgba(224,124,46,0.25)" },
  error:   { background: "rgba(197,60,60,0.1)",    color: "#c53c3c",            border: "rgba(197,60,60,0.25)"  },
};

interface BadgeProps { children: ReactNode; variant?: BadgeVariant; }

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  const s = styles[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "0.2rem 0.65rem", borderRadius: 9999,
      fontSize: "0.75rem", fontWeight: 600,
      background: s.background, color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {children}
    </span>
  );
}
