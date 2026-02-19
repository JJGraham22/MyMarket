import "./globals.css";
import type { ReactNode } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { AppUrlHandler } from "@/app/components/AppUrlHandler";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Market",
  description: "Find local farmers markets and fresh produce near you.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const navUser = user ? { id: user.id, email: user.email ?? null } : null;

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar user={navUser} />
        <AppUrlHandler />
        <main>{children}</main>
      </body>
    </html>
  );
}
