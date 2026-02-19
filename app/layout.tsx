import "./globals.css";
import type { ReactNode } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { AppUrlHandler } from "@/app/components/AppUrlHandler";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Market",
  description: "Local farmers market — seller checkout, QR payments, and more"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const navUser = user ? { id: user.id, email: user.email ?? null } : null;

  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "var(--ground)", color: "var(--cream)" }}>
        <Navbar user={navUser} />
        <AppUrlHandler />
        <main className="container py-12 sm:py-16" style={{ background: "var(--ground)", color: "var(--cream)" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
