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
      `${typeof window !== "undefined" ? window.location.origin : "https://algions-transit.vercel.app"}/verify?pnr=${encodeURIComponent(pnr)}`;

    QRCode.toDataURL(payload, {
      width: size,
      margin: 1,
      color: {
        dark: "#123B2F", // Rydvanta Forest Green
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error("QR Code Generation Error:", err));
  }, [pnr, verificationUrl, size]);

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-charcoal-border/80 shadow-xs">
      {dataUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={dataUrl}
          alt={`Verification QR Code for PNR ${pnr}`}
          width={size}
          height={size}
          className="rounded-xl shadow-xs"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center bg-ivory-soft rounded-xl"
        >
          <QrCode className="w-8 h-8 text-charcoal-muted animate-pulse" />
        </div>
      )}
      <div className="flex items-center gap-1 text-[10px] text-forest font-bold mt-2">
        <ShieldCheck className="w-3.5 h-3.5 text-forest" />
        <span>Scannable Pass</span>
      </div>
    </div>
  );
};
