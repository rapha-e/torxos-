import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  initialQuality?: number;
}

/**
 * Comprime imagens no navegador usando Web Workers antes do upload.
 * Reduz fotos de celulares modernos (8 MB - 15 MB) para 300 KB - 500 KB instantaneamente.
 */
export async function compressImageFile(
  file: File,
  customOptions?: CompressionOptions
): Promise<File> {
  // Arquivos SVG não precisam de compressão raster
  if (file.type === "image/svg+xml") {
    return file;
  }

  const defaultOptions: CompressionOptions = {
    maxSizeMB: 0.6, // Alvo de ~600 KB
    maxWidthOrHeight: 1920, // Resolução Full HD perfeita para laudos e detalhes de peças
    useWebWorker: true,
    fileType: "image/webp", // Formato ultra compacto e moderno
    initialQuality: 0.8,
  };

  const options = { ...defaultOptions, ...customOptions };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Preserva o nome do arquivo com extensão .webp
    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    return new File([compressedBlob], newFileName, {
      type: options.fileType || "image/webp",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("Compressão via Web Worker falhou, utilizando arquivo original ou fallback:", error);
    return file;
  }
}

/**
 * Converte qualquer File ou Blob para Base64 Data URL
 */
export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Pipeline completa no cliente:
 * Comprime o arquivo no navegador (WebP, máx 1920px, ~0.6MB) e devolve a Data URL
 */
export async function compressAndConvertToDataUrl(
  file: File,
  customOptions?: CompressionOptions
): Promise<{ dataUrl: string; originalSizeKB: number; compressedSizeKB: number }> {
  const originalSizeKB = Math.round(file.size / 1024);

  if (file.type === "image/svg+xml") {
    const dataUrl = await fileToDataUrl(file);
    return { dataUrl, originalSizeKB, compressedSizeKB: originalSizeKB };
  }

  const compressedFile = await compressImageFile(file, customOptions);
  const compressedSizeKB = Math.round(compressedFile.size / 1024);
  const dataUrl = await fileToDataUrl(compressedFile);

  return {
    dataUrl,
    originalSizeKB,
    compressedSizeKB,
  };
}

/**
 * Processa e otimiza imagens enviadas via upload no navegador (compatibilidade retroativa)
 */
export async function processImageFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8
): Promise<string> {
  const { dataUrl } = await compressAndConvertToDataUrl(file, {
    maxWidthOrHeight: Math.max(maxWidth, maxHeight),
    initialQuality: quality,
    fileType: "image/webp",
  });
  return dataUrl;
}
