import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  className?: string;
}

export function Input({
  id,
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-[var(--cream-muted)]"
      >
        {label}
      </label>
      <input
        id={id}
        className="input w-full"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
