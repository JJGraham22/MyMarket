"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { isNativePlatform } from "@/lib/capacitor";
import { PageHeader, Card, Button, Toast } from "@/app/components/ui";
import { TerminalPairing } from "./TerminalPairing";
import { ReaderPairing } from "@/app/seller/reader/ReaderPairing";

type PaymentProvider = "platform" | "stripe" | "square";

interface PaymentSettingsProps {
  userId: string;
  initial: {
    payment_provider: PaymentProvider;
    square_merchant_id: string | null;
    stripe_connected_account_id: string | null;
    square_device_id: string | null;
  };
  searchParams: {
    success?: string;
    error?: string;
  };
}

const providerInfo: Record<PaymentProvider, { label: string; description: string }> = {
  platform: {
    label: "Stripe (Platform)",
    description: "Use Stripe for checkout. Payments are processed through the platform's Stripe account. No setup required.",
  },
  stripe: {
    label: "Stripe Connect",
    description: "Connect your own Stripe account to receive payments directly. (Coming soon)",
  },
  square: {
    label: "Square",
    description: "Connect your own Square account. Accept online payments and use your Square Terminal or Reader for in-person tap-to-pay.",
  },
};

export function PaymentSettingsClient({ userId, initial, searchParams }: PaymentSettingsProps) {
  const [provider, setProvider] = useState<PaymentProvider>(initial.payment_provider);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.error ?? null);
  const [toastVisible, setToastVisible] = useState(searchParams.success === "square");
  const [toastMessage, setToastMessage] = useState(searchParams.success === "square" ? "Square account connected successfully!" : "");
  const [squareTokenValid, setSquareTokenValid] = useState<boolean | null>(initial.square_merchant_id ? null : false);

  const isSquareConnected = !!initial.square_merchant_id;
  const isStripeConnected = !!initial.stripe_connected_account_id;

  useEffect(() => {
    if (!initial.square_merchant_id) { setSquareTokenValid(false); return; }
    fetch("/api/auth/square/status")
      .then((r) => r.json())
      .then((data) => setSquareTokenValid(data.valid === true))
      .catch(() => setSquareTokenValid(false));
  }, [initial.square_merchant_id]);

  useEffect(() => {
    if (!isNativePlatform()) return;
    let cleanup: (() => void) | undefined;
    async function setupListener() {
      try {
        const { App } = await import("@capacitor/app");
        const { Browser } = await import("@capacitor/browser");
        const handle = await App.addListener("appUrlOpen", async (event) => {
          try { await Browser.close(); } catch {}
          if (event.url.includes("oauth/success")) {
            setToastMessage("Square account connected successfully!");
            setToastVisible(true);
            window.location.reload();
          } else if (event.url.includes("oauth/error")) {
            const url = new URL(event.url.replace("com.mymarket.app://", "https://app/"));
            setError(decodeURIComponent(url.searchParams.get("message") ?? "Square connection failed."));
          }
        });
        cleanup = () => handle.remove();
      } catch {}
    }
    setupListener();
    return () => cleanup?.();
  }, []);

  async function startSquareOAuth() {
    if (isNativePlatform()) {
      try {
        const res = await fetch("/api/auth/square?json=true&platform=native");
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to get Square OAuth URL.");
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: data.url, presentationStyle: "formSheet" });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to start Square OAuth.");
      }
    } else {
      window.location.href = "/api/auth/square";
    }
  }

  async function handleSelectProvider(selected: PaymentProvider) {
    if (selected === "square" && !isSquareConnected) { await startSquareOAuth(); return; }
    if (selected === "stripe" && !isStripeConnected) {
      setError("Stripe Connect is coming soon. Use Stripe (Platform) or connect Square.");
      return;
    }
    setProvider(selected);
    setSaving(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.from("profiles").update({ payment_provider: selected }).eq("id", userId);
    if (updateError) { setError(updateError.message); setSaving(false); }
    else {
      const messages: Record<PaymentProvider, string> = { platform: "Switched to Stripe (Platform).", square: "Switched to Square.", stripe: "Saved!" };
      setToastMessage(messages[selected]);
      setToastVisible(true);
      setSaving(false);
    }
  }

  async function handleDisconnectSquare() {
    setSaving(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.from("profiles").update({
      payment_provider: "platform", square_merchant_id: null, square_access_token: null,
      square_refresh_token: null, square_token_expires_at: null, square_location_id: null,
    }).eq("id", userId);
    if (updateError) { setError(updateError.message); }
    else { setProvider("platform"); setToastMessage("Square disconnected."); setToastVisible(true); window.location.reload(); }
    setSaving(false);
  }

  return (
    <>
      <div className="space-y-8">
        <PageHeader title="Payment settings" subtitle="Choose your preferred checkout service." />
        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        <div className="space-y-4">
          {(Object.keys(providerInfo) as PaymentProvider[]).map((key) => {
            const info = providerInfo[key];
            const isActive = provider === key;
            return (
              <Card key={key} padding="lg" className={`transition-all ${isActive ? "border-[var(--green-soft)] ring-1 ring-[var(--green-soft)]" : "hover:border-[rgba(168,137,104,0.4)]"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-semibold text-[var(--cream)]">{info.label}</h3>
                      {isActive && <span className="rounded-full bg-[var(--green-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--green-pale)]">Selected</span>}
                      {key === "square" && isSquareConnected && !isActive && <span className="rounded-full bg-[var(--brown-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--cream-muted)]">Connected</span>}
                      {key === "stripe" && <span className="rounded-full bg-[var(--brown-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--cream-muted)]">Coming Soon</span>}
                    </div>
                    <p className="text-sm text-[var(--cream-muted)]">{info.description}</p>
                    {key === "square" && isSquareConnected && (
                      <div className="mt-3 space-y-1 rounded-lg bg-[var(--brown-bg)] px-3 py-2.5">
                        {squareTokenValid === false && <p className="text-xs font-medium text-amber-400">Connection expired. Tap "Reconnect Square" to sign in again.</p>}
                        <p className="text-xs text-[var(--cream-muted)]">Merchant ID: <span className="font-mono text-[var(--cream)]">{initial.square_merchant_id}</span></p>
                        {initial.square_device_id && <p className="text-xs text-[var(--cream-muted)]">Terminal: <span className="font-mono text-[var(--cream)]">{initial.square_device_id}</span></p>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {key === "platform" && !isActive && <Button variant="secondary" onClick={() => handleSelectProvider("platform")} disabled={saving}>{saving ? "Saving…" : "Select"}</Button>}
                    {key === "square" && !isSquareConnected && <Button onClick={() => handleSelectProvider("square")} disabled={saving}>Connect Square</Button>}
                    {key === "square" && isSquareConnected && squareTokenValid === false && <Button onClick={startSquareOAuth} disabled={saving} className="bg-amber-600 hover:bg-amber-700">Reconnect Square</Button>}
                    {key === "square" && isSquareConnected && !isActive && squareTokenValid !== false && <Button variant="secondary" onClick={() => handleSelectProvider("square")} disabled={saving}>{saving ? "Saving…" : "Select Square"}</Button>}
                    {key === "square" && isSquareConnected && <Button variant="ghost" onClick={handleDisconnectSquare} disabled={saving} className="text-xs">Disconnect</Button>}
                    {key === "stripe" && <Button variant="secondary" disabled className="opacity-50 cursor-not-allowed">Coming Soon</Button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {isSquareConnected && (
        <div className="mt-8 space-y-6">
          <h2 className="text-lg font-semibold text-[var(--cream)]">In-person payment devices</h2>
          <TerminalPairing currentDeviceId={initial.square_device_id} />
          <ReaderPairing />
        </div>
      )}

      <Toast message={toastMessage} visible={toastVisible} onDismiss={() => setToastVisible(false)} />
    </>
  );
}