"use client";

import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QrCodeViewProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCodeView({ value, size = 128, className = "" }: QrCodeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      },
      (err) => {
        if (err) console.error("Erro ao gerar QR Code:", err);
      }
    );
  }, [value, size]);

  return (
    <div className={`inline-block bg-white p-1 rounded ${className}`}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
