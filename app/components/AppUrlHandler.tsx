"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativePlatform } from "@/lib/capacitor";

export function AppUrlHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    async function setup() {
      try {
        const { App } = await import("@capacitor/app");

        const handle = await App.addListener("appUrlOpen", (event) => {
          const url = event.url;
          if (!url.startsWith("com.mymarket.app://")) return;

          try {
            const parsed = new URL(url.replace("com.mymarket.app://", "https://app/"));
            const path = parsed.pathname;

            if (path === "/oauth/success") {
              router.push("/settings/payments?success=square");
              router.refresh();
            } else if (path === "/oauth/error") {
              const message = parsed.searchParams.get("message") ?? "oauth_failed";
              router.push(`/settings/payments?error=${message}`);
            }
          } catch {
            // URL parsing failed
          }
        });

        cleanup = () => handle.remove();
      } catch {
        // Not in native app
      }
    }

    setup();
    return () => cleanup?.();
  }, [router]);

  return null;
}