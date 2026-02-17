interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = "", lines = 1 }: SkeletonProps) {
  if (lines <= 1) {
    return (
      <div
        className={
          "h-4 animate-pulse rounded bg-[var(--brown-bg)] " + (className || "").trim()
        }
        aria-hidden
      />
    );
  }
  return (
    <div className={"space-y-2 " + (className || "").trim()} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-[var(--brown-bg)]"
          style={{ width: i === lines - 1 && lines > 1 ? "75%" : "100%" }}
        />
      ))}
    </div>
  );
}
