"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Link as LinkIcon, RefreshCw, Check } from "lucide-react";
import { processImageFile } from "@/lib/image-upload";

interface ImageUploaderProps {
  label: string;
  sublabel?: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  aspectRatio?: "square" | "wide";
  maxDimension?: number;
  maxSizeKB?: number;
  placeholderText?: string;
}

export function ImageUploader({
  label,
  sublabel,
  value,
  onChange,
  aspectRatio = "square",
  maxDimension = 500,
  placeholderText = "Arraste ou selecione uma imagem",
}: ImageUploaderProps) {
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).");
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await processImageFile(file, maxDimension, maxDimension);
      onChange(dataUrl);
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      alert("Não foi possível carregar a imagem.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      setIsUrlMode(false);
    }
  };

  const isSquare = aspectRatio === "square";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-[#181816] block">{label}</label>
          {sublabel && <p className="text-[11px] text-[#787774]">{sublabel}</p>}
        </div>

        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-[11px] text-[#787774] hover:text-[#181816] flex items-center gap-1 font-medium transition cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{isUrlMode ? "Upload por arquivo" : "Usar link (URL)"}</span>
        </button>
      </div>

      {isUrlMode ? (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://exemplo.com/imagem.png"
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#FAF9F6] border border-[#E5E5E0] text-[#181816] focus:outline-none focus:border-[#181816]"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-2 bg-[#181816] text-white text-xs font-semibold rounded-xl hover:bg-[#2b2a27] transition cursor-pointer shrink-0"
          >
            Aplicar Link
          </button>
        </div>
      ) : null}

      {/* Box Principal de Preview ou Upload */}
      {value ? (
        <div className="relative group p-2 rounded-2xl border border-[#EBEBE8] bg-[#FAF9F6] flex items-center justify-center overflow-hidden">
          <img
            src={value}
            alt={label}
            className={`object-contain rounded-xl ${
              isSquare ? "w-28 h-28" : "w-full h-32"
            } bg-white border border-[#E5E5E0] p-1 shadow-xs`}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-white text-[#181816] text-xs font-semibold rounded-lg shadow-sm hover:bg-[#FAF9F6] transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Trocar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="px-2.5 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-rose-700 transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? "border-[#181816] bg-amber-50/40"
              : "border-[#E5E5E0] bg-[#FAF9F6] hover:bg-[#F5F5F0] hover:border-[#181816]"
          } ${isSquare ? "h-32" : "h-28"}`}
        >
          {processing ? (
            <div className="flex flex-col items-center gap-1 text-xs text-[#787774]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#181816]" />
              <span>Otimizando imagem...</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-xl bg-white border border-[#EBEBE8] text-[#787774] flex items-center justify-center shadow-xs">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#181816] block">
                  {placeholderText}
                </span>
                <span className="text-[10px] text-[#787774]">
                  PNG, JPG, SVG ou WebP (até 5MB)
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />
    </div>
  );
}
