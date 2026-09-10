"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  Plus,
  Eye,
  X,
  Upload,
  RefreshCw,
  Check,
  Smartphone,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { compressAndConvertToDataUrl } from "@/lib/image-upload";

export interface DevicePhoto {
  id: string;
  label: string;
  dataUrl: string;
  timestamp: string;
}

interface PhotoChecklistProps {
  photos: DevicePhoto[];
  onChange: (photos: DevicePhoto[]) => void;
  title?: string;
  maxPhotos?: number;
}

const PHOTO_LABELS = [
  "Frente / Display",
  "Traseira / Tampa",
  "Lateral Direita",
  "Lateral Esquerda",
  "Câmeras / Lentes",
  "Avaria Específica",
];

export function PhotoChecklist({
  photos,
  onChange,
  title = "Vistoria Fotográfica do Aparelho (Entrada / Laudo)",
  maxPhotos = 6,
}: PhotoChecklistProps) {
  // Inputs ocultos para galeria e câmera nativa
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Estados de modais e captura
  const [choiceModalOpen, setChoiceModalOpen] = useState(false);
  const [liveCameraModalOpen, setLiveCameraModalOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>("Frente / Display");
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Elementos da Câmera ao Vivo WebRTC
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Finaliza a câmera se o modal for fechado
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setLiveCameraModalOpen(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Inicia a Câmera ao Vivo do Navegador (Webcam ou Câmera do Smartphone)
  const startLiveCamera = async (facing: "environment" | "user" = cameraFacingMode) => {
    setChoiceModalOpen(false);
    setLiveCameraModalOpen(true);
    setCameraLoading(true);
    setCameraError(null);

    // Para stream anterior se existir
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta captura direta. Usaremos a câmera do sistema.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.warn("Falha ao abrir WebRTC direta, acionando câmera nativa do sistema:", err);
      stopLiveCamera();
      // Fallback para câmera nativa via input capture
      cameraInputRef.current?.click();
    }
  };

  // Captura o frame atual do vídeo em Canvas e converte para imagem
  const [isCompressing, setIsCompressing] = useState(false);

  const captureFrameFromLiveCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Converte frame da câmera para WebP direto no canvas
    const dataUrl = canvas.toDataURL("image/webp", 0.82);

    addPhotoToState(dataUrl);
    stopLiveCamera();
  };

  const addPhotoToState = (dataUrl: string) => {
    const newPhoto: DevicePhoto = {
      id: `photo-${Date.now()}`,
      label: selectedLabel,
      dataUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    onChange([...photos, newPhoto]);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setChoiceModalOpen(false);
    setIsCompressing(true);

    try {
      // Comprime no navegador via browser-image-compression e converte para WebP
      const { dataUrl } = await compressAndConvertToDataUrl(file, {
        maxWidthOrHeight: 1920,
        maxSizeMB: 0.6,
        fileType: "image/webp",
        initialQuality: 0.8,
      });
      addPhotoToState(dataUrl);
    } catch (err) {
      console.error("Erro ao comprimir imagem:", err);
      // Fallback para leitura direta caso ocorra qualquer problema
      const reader = new FileReader();
      reader.onload = (event) => {
        const fallbackUrl = event.target?.result as string;
        addPhotoToState(fallbackUrl);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const removePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  const openChoiceModal = () => {
    if (photos.length >= maxPhotos) {
      alert(`Limite máximo de ${maxPhotos} fotos atingido para este laudo.`);
      return;
    }
    setChoiceModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#EBEBE8] shadow-sm">
      {/* Header do Componente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-[#181816] flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#787774]" />
            <span>{title}</span>
          </h4>
          <p className="text-xs text-[#787774] mt-0.5">
            Registre fotos do equipamento para resguardo jurídico e laudo técnico transparente. ({photos.length}/{maxPhotos})
          </p>
        </div>

        {photos.length < maxPhotos && (
          <div className="flex items-center gap-2">
            <select
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              className="text-xs border border-[#E5E5E0] bg-[#FAF9F6] rounded-xl px-2.5 py-1.5 text-[#181816] focus:outline-none focus:border-[#181816]"
            >
              {PHOTO_LABELS.map((lbl) => (
                <option key={lbl} value={lbl}>
                  {lbl}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={openChoiceModal}
              className="px-3.5 py-1.5 rounded-xl bg-[#181816] text-white text-xs font-medium hover:bg-[#282824] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>Adicionar Foto</span>
            </button>
          </div>
        )}
      </div>

      {isCompressing && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          <span>Comprimindo e convertendo foto para WebP no navegador...</span>
        </div>
      )}

      {/* Inputs Ocultos de Sistema */}
      {/* 1. Galeria / Arquivos do Dispositivo */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      {/* 2. Câmera Nativa do Celular (Fallback Direct Capture) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Área Vazia (Quando ainda não há fotos) */}
      {photos.length === 0 ? (
        <div
          onClick={openChoiceModal}
          className="w-full py-9 border border-dashed border-[#D6D5D0] rounded-2xl bg-[#FAF9F6] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F5F5F0] transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E5E0] flex items-center justify-center mb-2.5 text-[#787774] shadow-xs group-hover:scale-105 transition-transform">
            <ImageIcon className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-[#181816]">Nenhuma foto registrada ainda</p>
          <p className="text-[11px] text-[#787774] mt-0.5">
            Clique aqui para escolher entre <strong>Tirar com a Câmera</strong> ou <strong>Buscar no Dispositivo</strong>
          </p>
        </div>
      ) : (
        /* Grade de Fotos Cadastradas */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-xl border border-[#E5E5E0] bg-[#FAF9F6] overflow-hidden aspect-[4/3] flex flex-col shadow-xs"
            >
              <img
                src={photo.dataUrl}
                alt={photo.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(photo.dataUrl)}
                  className="p-2 rounded-xl bg-white/90 text-[#181816] hover:bg-white transition-colors"
                  title="Ampliar foto"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                  title="Excluir foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 text-white">
                <p className="text-[11px] font-medium truncate">{photo.label}</p>
                <p className="text-[9px] text-white/70">{photo.timestamp}</p>
              </div>
            </div>
          ))}

          {/* Botão de Adicionar Mais se estiver abaixo do limite */}
          {photos.length < maxPhotos && (
            <button
              type="button"
              onClick={openChoiceModal}
              className="border border-dashed border-[#D6D5D0] rounded-xl bg-[#FAF9F6] hover:bg-[#F5F5F0] transition flex flex-col items-center justify-center aspect-[4/3] text-[#787774] cursor-pointer"
            >
              <Plus className="w-5 h-5 mb-1 text-[#181816]" />
              <span className="text-xs font-semibold text-[#181816]">Mais Foto</span>
              <span className="text-[10px] text-[#787774]">({photos.length}/{maxPhotos})</span>
            </button>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. MODAL DE ESCOLHA: CÂMERA OU BUSCAR NO DISPOSITIVO                   */}
      {/* ===================================================================== */}
      {choiceModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#1C1C1A]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setChoiceModalOpen(false)}
        >
          <div
            className="max-w-md w-full p-6 rounded-2xl bg-white border border-[rgba(28,25,23,0.08)] shadow-elevated space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(28,25,23,0.07)]">
              <div>
                <h3 className="font-bold text-sm text-[#1C1C1A]">Como deseja inserir a foto?</h3>
                <p className="text-xs text-[#71716C] mt-0.5">
                  Ângulo selecionado: <strong className="text-[#1C1C1A]">{selectedLabel}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChoiceModalOpen(false)}
                className="text-[#71716C] hover:text-[#1C1C1A] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Opções de Escolha em Cards Elegantes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Opção A: Câmera em Tempo Real */}
              <button
                type="button"
                onClick={() => startLiveCamera("environment")}
                className="p-5 rounded-2xl border-2 border-[rgba(28,25,23,0.08)] hover:border-[#181816] bg-[#FDFDFD] hover:bg-[#F9F9F7] transition-all flex flex-col items-center text-center group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#181816] text-amber-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <Camera className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <span className="font-bold text-xs text-[#1C1C1A] block">Usar Câmera</span>
                <span className="text-[11px] text-[#71716C] mt-1 leading-snug">
                  Tirar foto agora pelo celular ou webcam da bancada
                </span>
              </button>

              {/* Opção B: Buscar no Dispositivo / Galeria */}
              <button
                type="button"
                onClick={() => {
                  setChoiceModalOpen(false);
                  galleryInputRef.current?.click();
                }}
                className="p-5 rounded-2xl border-2 border-[rgba(28,25,23,0.08)] hover:border-[#181816] bg-[#FDFDFD] hover:bg-[#F9F9F7] transition-all flex flex-col items-center text-center group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F3F3EF] text-[#1C1C1A] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm border border-[rgba(28,25,23,0.06)]">
                  <FolderOpen className="w-6 h-6 text-[#181816]" strokeWidth={1.75} />
                </div>
                <span className="font-bold text-xs text-[#1C1C1A] block">Buscar no Dispositivo</span>
                <span className="text-[11px] text-[#71716C] mt-1 leading-snug">
                  Escolher foto salva na galeria ou pastas do computador
                </span>
              </button>
            </div>

            {/* Dica de Bancada */}
            <div className="p-3 rounded-xl bg-[#F9F9F7] border border-[rgba(28,25,23,0.06)] text-[11px] text-[#71716C] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#A1A19B] shrink-0" />
              <span>Em smartphones e tablets, a opção <strong>Usar Câmera</strong> abre o obturador fotográfico na hora.</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. MODAL DA CÂMERA AO VIVO COM VISUALIZADOR DE BANCADA                */}
      {/* ===================================================================== */}
      {liveCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-xl w-full bg-[#181816] rounded-3xl overflow-hidden border border-stone-800 shadow-2xl flex flex-col text-white">
            {/* Top Bar da Câmera */}
            <div className="p-4 flex items-center justify-between border-b border-stone-800 bg-stone-900/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-stone-200">
                  Câmera Ativa • {selectedLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Botão Alternar Câmera Frontal / Traseira */}
                <button
                  type="button"
                  onClick={() => {
                    const nextFacing = cameraFacingMode === "environment" ? "user" : "environment";
                    setCameraFacingMode(nextFacing);
                    startLiveCamera(nextFacing);
                  }}
                  title="Alternar câmera"
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  title="Fechar câmera"
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewport de Vídeo da Câmera */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Linhas guias de enquadramento da bancada */}
              <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between text-[10px] text-white/50 font-mono">
                  <span>TorxOS VISTORIA</span>
                  <span>{selectedLabel.toUpperCase()}</span>
                </div>
                <div className="text-center text-[10px] text-white/50 font-mono">
                  ENQUADRE O APARELHO NO RETÂNGULO
                </div>
              </div>

              {cameraLoading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-300" />
                  <span className="text-xs text-stone-300">Inicializando lente da câmera...</span>
                </div>
              )}
            </div>

            {/* Rodapé com Botão Disparador (Estilo Câmera Pro) */}
            <div className="p-5 flex items-center justify-between bg-stone-900/80 border-t border-stone-800">
              <button
                type="button"
                onClick={stopLiveCamera}
                className="text-xs text-stone-400 hover:text-white transition px-3 py-2"
              >
                Cancelar
              </button>

              {/* Botão Obturador Central */}
              <button
                type="button"
                onClick={captureFrameFromLiveCamera}
                title="Tirar Foto"
                className="w-16 h-16 rounded-full border-4 border-white p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer bg-transparent"
              >
                <div className="w-full h-full rounded-full bg-white hover:bg-amber-100 transition-colors shadow-lg" />
              </button>

              <button
                type="button"
                onClick={() => {
                  stopLiveCamera();
                  galleryInputRef.current?.click();
                }}
                className="text-xs text-stone-400 hover:text-white transition px-3 py-2"
              >
                Galeria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. MODAL DE VISUALIZAÇÃO AMPLIADA DA FOTO                             */}
      {/* ===================================================================== */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img
              src={previewPhoto}
              alt="Foto do Aparelho"
              className="max-w-full max-h-[80vh] rounded-xl object-contain"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
