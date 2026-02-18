"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button } from "@/app/components/ui";
import { isNativePlatform } from "@/lib/capacitor";

type ReaderState =
  | { step: "not_native" }
  | { step: "idle" }
  | { step: "initializing" }
  | { step: "scanning" }
  | { step: "pairing"; readerId: string }
  | { step: "connected"; readerId: string; batteryLevel?: number }
  | { step: "error"; message: string };

/**
 * Square Reader pairing component.
 *
 * Only works inside a native Capacitor app (iOS/Android) because it uses
 * the Square Mobile Payments SDK via the Capacitor plugin for Bluetooth
 * Reader communication.
 *
 * On the web, this component shows a message directing the user to the
 * native app.
 */
export function ReaderPairing() {
  const [state, setState] = useState<ReaderState>({ step: "idle" });
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativePlatform());
    if (!isNativePlatform()) {
      setState({ step: "not_native" });
    }
  }, []);

  const initializeSDK = useCallback(async () => {
    if (!isNative) return;

    setState({ step: "initializing" });

    try {
      // Dynamic import so it doesn't break web builds
      const { SquareMobilePayments } = await import(
        "@capawesome/capacitor-square-mobile-payments"
      );

      // Authorize with the seller's Square access token
      // In a real implementation, this token would come from the server
      await SquareMobilePayments.authorize({
        accessToken: "", // Will be set from seller's stored token via API
      });

      setState({ step: "idle" });
    } catch (err: unknown) {
      setState({
        step: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to initialize Square SDK.",
      });
    }
  }, [isNative]);

  async function handleStartScanning() {
    if (!isNative) return;

    setState({ step: "scanning" });

    try {
      const { SquareMobilePayments } = await import(
        "@capawesome/capacitor-square-mobile-payments"
      );

      // Listen for pairing events
      await SquareMobilePayments.addListener(
        "readerPairingDidBegin",
        () => {
          setState({ step: "scanning" });
        }
      );

      await SquareMobilePayments.addListener(
        "readerPairingDidSucceed",
        () => {
          // Pairing succeeded — reader details arrive via readerWasAdded
        }
      );

      await SquareMobilePayments.addListener(
        "readerPairingDidFail",
        (event) => {
          setState({
            step: "error",
            message: event?.message ?? "Reader pairing failed.",
          });
        }
      );

      await SquareMobilePayments.addListener(
        "readerWasAdded",
        (event) => {
          setState({
            step: "connected",
            readerId: event?.reader?.serialNumber ?? "unknown",
          });
        }
      );

      await SquareMobilePayments.addListener(
        "readerWasRemoved",
        () => {
          setState({ step: "idle" });
        }
      );

      await SquareMobilePayments.startPairing();
    } catch (err: unknown) {
      setState({
        step: "error",
        message:
          err instanceof Error ? err.message : "Failed to scan for readers.",
      });
    }
  }

  async function handleStopScanning() {
    try {
      const { SquareMobilePayments } = await import(
        "@capawesome/capacitor-square-mobile-payments"
      );
      await SquareMobilePayments.stopPairing();
      setState({ step: "idle" });
    } catch {
      setState({ step: "idle" });
    }
  }

  // Web fallback
  if (state.step === "not_native") {
    return (
      <Card padding="lg" className="space-y-3">
        <h3 className="text-base font-semibold text-[var(--cream)]">
          Square Reader
        </h3>
        <p className="text-sm text-[var(--cream-muted)]">
          To pair a Square Reader for tap-to-pay, open this app on your phone
          using the MyMarket native app. Reader pairing requires Bluetooth,
          which is only available in the native app.
        </p>
        <p className="text-xs text-[var(--cream-muted)]">
          Alternatively, if you have a Square Terminal (standalone device), you
          can pair it from the web using the Terminal pairing above.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--cream)]">
          Square Reader
        </h3>
        <p className="text-sm text-[var(--cream-muted)]">
          Pair your Square Reader to accept contactless tap-to-pay, chip, and
          swipe payments directly from your phone.
        </p>
      </div>

      {state.step === "idle" && (
        <div className="space-y-2">
          <Button onClick={initializeSDK}>Initialize Square SDK</Button>
          <Button variant="secondary" onClick={handleStartScanning}>
            Scan for readers
          </Button>
        </div>
      )}

      {state.step === "initializing" && (
        <p className="text-sm text-[var(--cream-muted)]">
          Initializing Square Mobile Payments SDK...
        </p>
      )}

      {state.step === "scanning" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-[var(--green-pale)]" />
            <p className="text-sm text-[var(--cream)]">
              Scanning for nearby Square Readers...
            </p>
          </div>
          <p className="text-xs text-[var(--cream-muted)]">
            Make sure your Square Reader is turned on and Bluetooth is enabled
            on this device.
          </p>
          <Button variant="ghost" onClick={handleStopScanning}>
            Stop scanning
          </Button>
        </div>
      )}

      {state.step === "pairing" && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--green-pale)] border-t-transparent" />
            <p className="text-sm text-[var(--cream)]">
              Pairing with reader...
            </p>
          </div>
          <p className="text-xs font-mono text-[var(--cream-muted)]">
            Reader: {state.readerId}
          </p>
        </div>
      )}

      {state.step === "connected" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--green-bg)] px-3 py-2">
            <span className="text-sm font-medium text-[var(--green-pale)]">
              Reader connected
            </span>
          </div>
          <p className="text-xs text-[var(--cream-muted)]">
            Reader ID:{" "}
            <span className="font-mono text-[var(--cream)]">
              {state.readerId}
            </span>
          </p>
          {state.batteryLevel !== undefined && (
            <p className="text-xs text-[var(--cream-muted)]">
              Battery: {state.batteryLevel}%
            </p>
          )}
        </div>
      )}

      {state.step === "error" && (
        <div className="space-y-3">
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {state.message}
          </p>
          <Button variant="secondary" onClick={handleStartScanning}>
            Try again
          </Button>
        </div>
      )}
    </Card>
  );
}
