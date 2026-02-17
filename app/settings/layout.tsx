import Link from "next/link";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-[var(--cream-muted)] transition-colors hover:text-[var(--green-pale)]"
      >
        &larr; Back to dashboard
      </Link>
      {children}
    </div>
  );
}
