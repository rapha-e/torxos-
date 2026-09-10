import { Injectable, Logger } from "@nestjs/common";
import sharp from "sharp";

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface OptimizedImageResult {
  buffer: Buffer;
  dataUrl: string;
  mimeType: string;
  format: string;
  width?: number;
  height?: number;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  savedBytes: number;
  reductionPercentage: number;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  /**
   * Redimensiona (largura máx 1920px) e converte fotos para WebP com qualidade de 80%.
   * Suporta Buffer bruto ou string Base64 / Data URL.
   */
  async processAndConvertToWebp(
    input: Buffer | string,
    options?: OptimizeImageOptions
  ): Promise<OptimizedImageResult> {
    const maxWidth = options?.maxWidth || 1920;
    const quality = options?.quality || 80;

    let inputBuffer: Buffer;
    let originalSizeBytes = 0;

    if (typeof input === "string") {
      // Remove o prefixo data:image/...;base64, caso exista
      const base64Clean = input.includes(",") ? input.split(",")[1] : input;
      inputBuffer = Buffer.from(base64Clean, "base64");
      originalSizeBytes = inputBuffer.length;
    } else {
      inputBuffer = input;
      originalSizeBytes = input.length;
    }

    // Instancia o pipeline do Sharp
    const pipeline = sharp(inputBuffer, { failOn: "none" })
      .rotate() // Auto-rotaciona baseado no EXIF da câmera do smartphone
      .resize({
        width: maxWidth,
        withoutEnlargement: true, // Não estica fotos que já sejam menores que 1920px
        fit: "inside",
      })
      .webp({
        quality: quality,
        effort: 4, // Equilíbrio perfeito entre CPU e compressão
      });

    const { data: outputBuffer, info } = await pipeline.toBuffer({ resolveWithObject: true });

    const optimizedSizeBytes = outputBuffer.length;
    const savedBytes = Math.max(0, originalSizeBytes - optimizedSizeBytes);
    const reductionPercentage = originalSizeBytes > 0
      ? Math.round((savedBytes / originalSizeBytes) * 100)
      : 0;

    const base64Output = outputBuffer.toString("base64");
    const dataUrl = `data:image/webp;base64,${base64Output}`;

    this.logger.log(
      `Foto otimizada via Sharp WebP: ${(originalSizeBytes / 1024).toFixed(1)} KB -> ${(optimizedSizeBytes / 1024).toFixed(1)} KB (${reductionPercentage}% economia)`
    );

    return {
      buffer: outputBuffer,
      dataUrl,
      mimeType: "image/webp",
      format: "webp",
      width: info.width,
      height: info.height,
      originalSizeBytes,
      optimizedSizeBytes,
      savedBytes,
      reductionPercentage,
    };
  }
}
