import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { MediaService } from "./media.service";
import { OptimizeImageDto } from "./dto/optimize-image.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Mídia & Laudos Fotográficos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("optimize-base64")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Otimiza e converte foto para WebP (Sharp)",
    description: "Recebe imagem em base64, redimensiona para largura máx 1920px e converte para WebP (qualidade 80%).",
  })
  @ApiResponse({ status: 200, description: "Foto processada com sucesso em formato WebP" })
  async optimizeBase64(@Body() dto: OptimizeImageDto) {
    const result = await this.mediaService.processAndConvertToWebp(dto.dataUrl, {
      maxWidth: dto.maxWidth,
      quality: dto.quality,
    });

    return {
      success: true,
      format: result.format,
      mimeType: result.mimeType,
      width: result.width,
      height: result.height,
      originalSizeKB: Math.round(result.originalSizeBytes / 1024),
      optimizedSizeKB: Math.round(result.optimizedSizeBytes / 1024),
      savedKB: Math.round(result.savedBytes / 1024),
      reductionPercentage: result.reductionPercentage,
      dataUrl: result.dataUrl,
    };
  }

  @Post("upload")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Upload e conversão direta para WebP",
    description: "Processa foto de vistoria/laudo e disponibiliza a versão WebP otimizada.",
  })
  async uploadPhoto(@Body() dto: OptimizeImageDto) {
    return this.optimizeBase64(dto);
  }
}
