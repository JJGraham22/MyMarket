import "./globals.css";
import type { ReactNode } from "react";
import { Navbar } from "./components/Navbar";

export const metadata = {
  title: "My Market",
  description: "Local farmers market — seller checkout, QR payments, and more"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          {children}
        </main>
      </body>
    </html>
  );
}
