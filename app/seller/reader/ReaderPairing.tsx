"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button } from "@/app/components/ui";
import { isNativePlatform } from "@/lib/capacitor";

type ReaderState =
  | { step: "not_native" }
  | { step: "idle" }
  | { step: "authorizing" }
  | { step: "initializing" }
  | { step: "scanning" }
  | { step: "pairing"; readerId: string }
  | { step: "connected"; readerId: string; batteryLevel?: number }
  | { step: "error"; message: string };

export function ReaderPairing() {
  const [state, setState] = useState<ReaderState>({ step: "idle" });
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const native = isNativePlatform();
    setIsNative(native);
    if (!native) setState({ step: "not_native" });
  }, []);

  const initializeSDK = useCallback(async () => {
    if (!isNative) return;
    setState({ step: "authorizing" });
    try {
      const tokenRes = await fetch("/api/seller/square-access-token");
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.accessToken) {
        throw new Error(tokenData.error ?? "Could not retrieve Square token. Make sure Square is connected in Settings → Payments.");
      }
      setState({ step: "initializing" });
      const { SquareMobilePayments } = await import("@capawesome/capacitor-square-mobile-payments");
      await SquareMobilePayments.authorize({ accessToken: tokenData.accessToken });
      setState({ step: "idle" });
    } catch (err: unknown) {
      setState({ step: "error", message: err instanceof Error ? err.message : "Failed to initialize Square SDK." });
    }
  }, [isNative]);

  async function handleStartScanning() {
    if (!isNative) return;
    setState({ step: "scanning" });
    try {
      const { SquareMobilePayments } = await import("@capawesome/capacitor-square-mobile-payments");
      await SquareMobilePayments.addListener("readerPairingDidBegin", () => setState({ step: "scanning" }));
      await SquareMobilePayments.addListener("readerPairingDidSucceed", () => {});
      await SquareMobilePayments.addListener("readerPairingDidFail", (event) => {
        setState({ step: "error", message: event?.message ?? "Reader pairing failed." });
      });
      await SquareMobilePayments.addListener("readerWasAdded", (event) => {
        setState({ step: "connected", readerId: event?.reader?.serialNumber ?? "unknown" });
      });
      await SquareMobilePayments.addListener("readerWasRemoved", () => setState({ step: "idle" }));
      await SquareMobilePayments.startPairing();
    } catch (err: unknown) {
      setState({ step: "error", message: err instanceof Error ? err.message : "Failed to scan for readers." });
    }
  }

  async function handleStopScanning() {
    try {
      const { SquareMobilePayments } = await import("@capawesome/capacitor-square-mobile-payments");
      await SquareMobilePayments.stopPairing();
    } catch {}
    setState({ step: "idle" });
  }

  if (state.step === "not_native") {
    return (
      <Card padding="lg" className="space-y-3">
        <h3 className="text-base font-semibold text-[var(--cream)]">Square Reader</h3>
        <p className="text-sm text-[var(--cream-muted)]">
          To pair a Square Reader, open the MyMarket app on your iPhone or Android phone. Reader pairing requires Bluetooth and is only available in the native app.
        </p>
        <p className="text-xs text-[var(--cream-muted)]">
          If you have a standalone Square Terminal, pair it from the web using the Terminal pairing section above.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--cream)]">Square Reader</h3>
        <p className="text-sm text-[var(--cream-muted)]">Pair your Square Reader to accept tap-to-pay, chip, and swipe payments from your phone.</p>
      </div>

      {state.step === "idle" && (
        <div className="space-y-2">
          <Button onClick={initializeSDK}>Initialise Square SDK</Button>
          <Button variant="secondary" onClick={handleStartScanning}>Scan for readers</Button>
        </div>
      )}
      {state.step === "authorizing" && (
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--green-pale)] border-t-transparent" />
          <p className="text-sm text-[var(--cream-muted)]">Authorising with Square…</p>
        </div>
      )}
      {state.step === "initializing" && (
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--green-pale)] border-t-transparent" />
          <p className="text-sm text-[var(--cream-muted)]">Initialising Square SDK…</p>
        </div>
      )}
      {state.step === "scanning" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-[var(--green-pale)]" />
            <p className="text-sm text-[var(--cream)]">Scanning for nearby Square Readers…</p>
          </div>
          <p className="text-xs text-[var(--cream-muted)]">Make sure your Reader is powered on and Bluetooth is enabled.</p>
          <Button variant="ghost" onClick={handleStopScanning}>Stop scanning</Button>
        </div>
      )}
      {state.step === "pairing" && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--green-pale)] border-t-transparent" />
            <p className="text-sm text-[var(--cream)]">Pairing with reader…</p>
          </div>
          <p className="text-xs font-mono text-[var(--cream-muted)]">Reader: {state.readerId}</p>
        </div>
      )}
      {state.step === "connected" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--green-bg)] px-3 py-2">
            <span className="text-sm font-medium text-[var(--green-pale)]">✓ Reader connected</span>
          </div>
          <p className="text-xs text-[var(--cream-muted)]">Reader ID: <span className="font-mono text-[var(--cream)]">{state.readerId}</span></p>
          <Button variant="secondary" onClick={handleStartScanning}>Pair another reader</Button>
        </div>
      )}
      {state.step === "error" && (
        <div className="space-y-3">
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{state.message}</p>
          <div className="flex gap-2">
            <Button onClick={initializeSDK}>Re-initialise SDK</Button>
            <Button variant="secondary" onClick={handleStartScanning}>Try scanning again</Button>
          </div>
        </div>
      )}
    </Card>
  );
}