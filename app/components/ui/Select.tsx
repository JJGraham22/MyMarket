import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  className?: string;
}

export function Select({
  id,
  label,
  options,
  placeholder,
  error,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-[var(--cream-muted)]"
      >
        {label}
      </label>
      <select
        id={id}
        className="input w-full"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
