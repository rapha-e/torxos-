import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
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
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Public()
  @Get("slide-:slideNumber.png")
  @ApiOperation({
    summary: "Renderiza um slide PNG com extensão explícita compatível com validadores do Instagram",
  })
  async renderSlideWithExtension(
    @Param("slideNumber") slideNumberParam: string,
    @Query("title") title: string,
    @Query("subtitle") subtitle: string,
    @Query("badge") badge: string,
    @Query("total") total: number,
    @Query("type") type: any,
    @Query("bullets") bulletsJson: string,
    @Res() res: FastifyReply,
  ) {
    return this.handleRenderSlide(
      title,
      subtitle,
      badge,
      Number(slideNumberParam) || 1,
      total,
      type,
      bulletsJson,
      res,
    );
  }

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
    return this.handleRenderSlide(
      title,
      subtitle,
      badge,
      Number(slide) || 1,
      total,
      type,
      bulletsJson,
      res,
    );
  }

  private async handleRenderSlide(
    title: string,
    subtitle: string,
    badge: string,
    slideNumber: number,
    total: number,
    type: any,
    bulletsJson: string,
    res: FastifyReply,
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
      slideNumber,
      totalSlides: Number(total) || 6,
      type: type || (slideNumber === 1 ? "COVER" : "CONTENT"),
      bullets,
    });

    res.header("Content-Type", "image/png");
    res.header("Cache-Control", "public, max-age=86400");
    return res.send(pngBuffer);
  }

  @Get("presets")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Lista pilares, temas de bancada e hashtags recomendadas para redes sociais",
  })
  @ApiResponse({ status: 200, description: "Presets retornados com sucesso." })
  getPresets() {
    return this.socialService.getPresets();
  }

  @Post("generate-carousel")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Gera carrossel educativo para Instagram com slides formatados e SVG de alta resolução",
  })
  @ApiResponse({ status: 200, description: "Carrossel gerado com sucesso." })
  generateCarousel(@Body() dto: GenerateCarouselDto) {
    return this.socialService.generateCarousel(dto);
  }

  @Post("generate-weekly-pack")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Gera pacote semanal completo de postagens (Segunda, Quarta e Sexta)",
  })
  @ApiResponse({ status: 200, description: "Grade semanal gerada com sucesso." })
  generateWeeklyPack(@Body() dto: GenerateWeeklyPackDto) {
    return this.socialService.generateWeeklyPack(dto);
  }

  @Post("dispatch-webhook")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Dispara webhook com o post formatado para n8n, Make, Buffer ou Zapier",
  })
  @ApiResponse({ status: 200, description: "Webhook disparado com sucesso." })
  dispatchWebhook(@Body() dto: PublishWebhookDto) {
    return this.socialService.dispatchWebhook(dto);
  }
}
