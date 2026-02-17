"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, visible, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg"
      style={{
        background: "var(--green-bg)",
        border: "1px solid var(--green-soft)",
        color: "var(--green-pale)",
      }}
    >
      {message}
    </div>
  );
}
