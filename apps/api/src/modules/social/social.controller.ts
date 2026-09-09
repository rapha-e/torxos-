import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
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
