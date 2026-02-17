import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "remove" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  remove: "btn-remove",
  ghost: "border border-transparent text-[var(--cream-muted)] hover:bg-[var(--brown-bg)] hover:text-[var(--cream)]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

export function Button(props: ButtonProps) {
  const {
    children,
    variant = "primary",
    className = "",
    type = "button",
    ...rest
  } = props;
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-[0.9375rem] transition-all disabled:opacity-60 disabled:cursor-not-allowed";
  const classes = base + " " + variantClasses[variant] + " " + className.trim();
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
