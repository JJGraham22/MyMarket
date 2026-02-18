"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@/app/components/ui";

interface TerminalPairingProps {
  currentDeviceId: string | null;
}

type PairingState =
  | { step: "idle" }
  | { step: "loading" }
  | {
      step: "code_shown";
      pairingCode: string;
      deviceCodeId: string;
      expiresAt: string | null;
    }
  | { step: "paired"; deviceId: string }
  | { step: "error"; message: string };

export function TerminalPairing({ currentDeviceId }: TerminalPairingProps) {
  const [state, setState] = useState<PairingState>(
    currentDeviceId
      ? { step: "paired", deviceId: currentDeviceId }
      : { step: "idle" }
  );

  const pollStatus = useCallback(async (deviceCodeId: string) => {
    try {
      const res = await fetch(
        `/api/square/terminal/pair?deviceCodeId=${deviceCodeId}`
      );
      const data = await res.json();

      if (!res.ok) {
        setState({ step: "error", message: data.error });
        return false;
      }

      if (data.status === "PAIRED" && data.deviceId) {
        setState({ step: "paired", deviceId: data.deviceId });
        return true;
      }

      if (data.status === "EXPIRED") {
        setState({ step: "error", message: "Pairing code expired. Try again." });
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  // Poll for pairing completion when code is shown
  useEffect(() => {
    if (state.step !== "code_shown") return;

    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled) return;
      const done = await pollStatus(state.deviceCodeId);
      if (done) clearInterval(interval);
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [state, pollStatus]);

  async function handleStartPairing() {
    setState({ step: "loading" });

    try {
      const res = await fetch("/api/square/terminal/pair", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ step: "error", message: data.error });
        return;
      }

      setState({
        step: "code_shown",
        pairingCode: data.pairingCode,
        deviceCodeId: data.deviceCodeId,
        expiresAt: data.expiresAt,
      });
    } catch (err: unknown) {
      setState({
        step: "error",
        message:
          err instanceof Error ? err.message : "Failed to start pairing.",
      });
    }
  }

  return (
    <Card padding="lg" className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--cream)]">
          Square Terminal
        </h3>
        <p className="text-sm text-[var(--cream-muted)]">
          Pair your Square Terminal device to accept in-person tap-to-pay
          directly from this app.
        </p>
      </div>

      {state.step === "idle" && (
        <Button onClick={handleStartPairing}>Pair Terminal device</Button>
      )}

      {state.step === "loading" && (
        <p className="text-sm text-[var(--cream-muted)]">
          Generating pairing code...
        </p>
      )}

      {state.step === "code_shown" && (
        <div className="space-y-3">
          <div className="rounded-lg bg-[var(--brown-bg)] p-4 text-center">
            <p className="text-xs text-[var(--cream-muted)]">
              Enter this code on your Square Terminal
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-[var(--green-pale)]">
              {state.pairingCode}
            </p>
          </div>
          <p className="text-xs text-[var(--cream-muted)]">
            On your Square Terminal, go to{" "}
            <span className="font-medium text-[var(--cream)]">
              Settings &rarr; Device &rarr; Pair for Terminal API
            </span>{" "}
            and enter the code above. Checking status every 5 seconds...
          </p>
          {state.expiresAt && (
            <p className="text-xs text-[var(--cream-muted)]">
              Code expires:{" "}
              <span className="font-mono">
                {new Date(state.expiresAt).toLocaleTimeString()}
              </span>
            </p>
          )}
        </div>
      )}

      {state.step === "paired" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--green-bg)] px-3 py-2">
            <span className="text-sm font-medium text-[var(--green-pale)]">
              Terminal paired
            </span>
          </div>
          <p className="text-xs text-[var(--cream-muted)]">
            Device ID:{" "}
            <span className="font-mono text-[var(--cream)]">
              {state.deviceId}
            </span>
          </p>
          <Button variant="ghost" className="text-xs" onClick={handleStartPairing}>
            Pair a different device
          </Button>
        </div>
      )}

      {state.step === "error" && (
        <div className="space-y-3">
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {state.message}
          </p>
          <Button variant="secondary" onClick={handleStartPairing}>
            Try again
          </Button>
        </div>
      )}
    </Card>
  );
}
