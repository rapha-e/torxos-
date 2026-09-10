import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { FastifyReply } from "fastify";
import { JwtAuthGuard, Public } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../../common/guards/roles.guard";
import { UserRole } from "../../common/enums";
import { SocialService } from "./social.service";
import {
  GenerateCarouselDto,
  GenerateWeeklyPackDto,
  PublishWebhookDto,
} from "./dto/social.dto";

@ApiTags("Social Media & Automação de Postagens")
@Controller("social")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Public()
  @Get("render-slide-png")
  @ApiOperation({
    summary: "Renderiza um slide oficial do TorxOS para imagem PNG 1080x1080 em alta definição para o Instagram",
  })
  async renderSlidePng(
    @Query("title") title: string,
    @Query("subtitle") subtitle: string,
    @Query("badge") badge: string,
    @Query("slide") slide: number,
    @Query("total") total: number,
    @Query("type") type: any,
    @Query("bullets") bulletsJson: string,
    @Res() res: FastifyReply,
  ) {
    let bullets: string[] | undefined = undefined;
    if (bulletsJson) {
      try {
        bullets = JSON.parse(bulletsJson);
      } catch {}
    }

    const pngBuffer = await this.socialService.renderSlideToPng({
      title: title || "TorxOS - Gestão de Assistência",
      subtitle: subtitle || "",
      badge: badge || "BANCADA & TÉCNICA",
      slideNumber: Number(slide) || 1,
      totalSlides: Number(total) || 6,
      type: type || (Number(slide) === 1 ? "COVER" : "CONTENT"),
      bullets,
    });

    res.header("Content-Type", "image/png");
    res.header("Cache-Control", "public, max-age=86400");
    return res.send(pngBuffer);
  }

  @Get("presets")
  @ApiOperation({
    summary: "Lista pilares, temas de bancada e hashtags recomendadas para redes sociais",
  })
  @ApiResponse({ status: 200, description: "Presets retornados com sucesso." })
  getPresets() {
    return this.socialService.getPresets();
  }

  @Post("generate-carousel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Gera carrossel educativo para Instagram com slides formatados e SVG de alta resolução",
  })
  @ApiResponse({ status: 200, description: "Carrossel gerado com sucesso." })
  generateCarousel(@Body() dto: GenerateCarouselDto) {
    return this.socialService.generateCarousel(dto);
  }

  @Post("generate-weekly-pack")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Gera pacote semanal completo de postagens (Segunda, Quarta e Sexta)",
  })
  @ApiResponse({ status: 200, description: "Grade semanal gerada com sucesso." })
  generateWeeklyPack(@Body() dto: GenerateWeeklyPackDto) {
    return this.socialService.generateWeeklyPack(dto);
  }

  @Post("dispatch-webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Dispara webhook com o post formatado para n8n, Make, Buffer ou Zapier",
  })
  @ApiResponse({ status: 200, description: "Webhook disparado com sucesso." })
  dispatchWebhook(@Body() dto: PublishWebhookDto) {
    return this.socialService.dispatchWebhook(dto);
  }
}
