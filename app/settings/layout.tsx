import Link from "next/link";

const settingsNav = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/payments", label: "Payments" },
];

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

      <nav className="flex gap-2">
        {settingsNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--cream-muted)] transition-colors hover:bg-[var(--brown-bg)] hover:text-[var(--cream)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
