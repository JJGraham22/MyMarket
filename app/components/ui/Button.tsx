import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "remove" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "btn-primary",
  secondary: "btn-secondary",
  remove:    "btn-remove",
  ghost:     "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold border border-transparent text-[var(--forest)] hover:bg-[var(--sage-bg)] transition-all",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

export function Button(props: ButtonProps) {
  const { children, variant = "primary", className = "", type = "button", ...rest } = props;
  const base = "inline-flex items-center justify-center gap-2 font-semibold text-[0.9375rem] transition-all disabled:opacity-55 disabled:cursor-not-allowed";
  return (
    <button type={type} className={`${base} ${variantClasses[variant]} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
