"use client";

import React, { useRef, useState, useEffect } from "react";
import { Eraser, Check, PenTool } from "lucide-react";

interface SignatureCanvasProps {
  onSave: (signatureBase64: string) => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function SignatureCanvas({
  onSave,
  title = "Assinatura Digital do Cliente",
  subtitle = "Desenhe a assinatura no campo abaixo com o dedo ou mouse",
  className = "",
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolução nítida para telas de alta densidade (Retina)
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.scale(ratio, ratio);

    ctx.strokeStyle = "#181816";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasSignature(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    const base64 = canvas.toDataURL("image/png");
    onSave(base64);
  };

  return (
    <div className={`bg-white rounded-2xl p-6 border border-[#EBEBE8] shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-[#181816] flex items-center gap-2">
            <PenTool className="w-4 h-4 text-[#787774]" />
            {title}
          </h4>
          <p className="text-xs text-[#787774] mt-0.5">{subtitle}</p>
        </div>
        {hasSignature && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Traço capturado
          </span>
        )}
      </div>

      {/* Área de desenho do Canvas */}
      <div className="relative w-full h-44 bg-[#FAF9F6] rounded-xl border border-dashed border-[#D6D5D0] overflow-hidden touch-none flex flex-col justify-end">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {/* Linha guia de assinatura */}
        <div className="absolute bottom-6 left-8 right-8 border-b border-[#E0DFD8] pointer-events-none flex justify-between">
          <span className="text-[10px] text-[#A8A7A1] -mb-4">X Assine sobre esta linha</span>
        </div>
      </div>

      {/* Botões de controle */}
      <div className="flex items-center justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={clearCanvas}
          className="px-3 py-1.5 rounded-lg border border-[#E5E5E0] text-xs font-medium text-[#555] hover:bg-[#F5F5F2] hover:text-[#181816] flex items-center gap-1.5 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" />
          Limpar
        </button>
        <button
          type="button"
          disabled={!hasSignature}
          onClick={handleConfirm}
          className="px-4 py-1.5 rounded-lg bg-[#181816] text-xs font-medium text-white hover:bg-[#282824] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Check className="w-3.5 h-3.5" />
          Confirmar Assinatura
        </button>
      </div>
    </div>
  );
}
