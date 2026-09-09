import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AiMentorService } from "./ai-mentor.service";
import { ConsultMentorDto, GenerateQuoteCopyDto } from "./dto/ai-mentor.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PlanFeatureGuard, RequireFeature } from "../../common/guards/plan-feature.guard";
import { CurrentTenant, CurrentUser } from "../../common/decorators/user.decorator";

@ApiTags("TorxOS AI Mentor (Copiloto Inteligente)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlanFeatureGuard)
@RequireFeature("canUseAiMentor")
@Controller("ai-mentor")
export class AiMentorController {
  constructor(private aiMentorService: AiMentorService) {}

  @Post("consult")
  @ApiOperation({ summary: "Chat em linguagem natural com a IA, injetando o contexto do pilar escolhido" })
  async consult(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: ConsultMentorDto,
  ) {
    return this.aiMentorService.consult(tenantId, userId, dto);
  }

  @Get("daily-briefing")
  @ApiOperation({ summary: "Retorna os insights matinais consolidados da loja" })
  async getDailyBriefing(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.aiMentorService.getDailyBriefing(tenantId, userId);
  }

  @Post("copywriting/quote-message")
  @ApiOperation({ summary: "Gera copy de WhatsApp personalizada e persuasiva para o cliente da OS" })
  async generateQuoteCopy(
    @CurrentTenant() tenantId: string,
    @Body() dto: GenerateQuoteCopyDto,
  ) {
    return this.aiMentorService.generateQuoteCopy(tenantId, dto);
  }
}
