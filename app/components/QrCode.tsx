"use client";

import QRCode from "react-qr-code";

export function QrCode({ value, size = 176 }: { value: string; size?: number }) {
  return (
    <div className="inline-flex flex-col items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
      <div className="rounded-xl bg-white p-3">
        <QRCode value={value} size={size} />
      </div>
      <p className="max-w-xs text-center text-[0.7rem] text-slate-300">
        Ask the buyer to scan this QR code with their phone camera to open the payment page.
      </p>
      <p className="max-w-xs break-all text-center text-[0.65rem] text-slate-500">
        {value}
      </p>
    </div>
  );
}

