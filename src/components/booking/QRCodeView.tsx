"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, ShieldCheck } from "lucide-react";

interface QRCodeViewProps {
  pnr: string;
  verificationUrl?: string;
  size?: number;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  pnr,
  verificationUrl,
  size = 120,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const payload =
      verificationUrl ||
      `https://algions-transit.vercel.app/passenger/bookings?pnr=${encodeURIComponent(pnr)}`;

    QRCode.toDataURL(payload, {
      width: size,
      margin: 1,
      color: {
        dark: "#1e3a8a", // Brand Transit Navy
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error("QR Code Generation Error:", err));
  }, [pnr, verificationUrl, size]);

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`Verification QR Code for PNR ${pnr}`}
          width={size}
          height={size}
          className="rounded-lg shadow-xs"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg"
        >
          <QrCode className="w-8 h-8 text-slate-400 animate-pulse" />
        </div>
      )}
      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-1.5">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span>Scannable Pass</span>
      </div>
    </div>
  );
};
