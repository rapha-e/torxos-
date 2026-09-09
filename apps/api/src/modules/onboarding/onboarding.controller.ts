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
import { OnboardingService } from "./onboarding.service";
import {
  DispatchOnboardingMessageDto,
  UpdateOnboardingConfigDto,
} from "./dto/onboarding.dto";

@ApiTags("Onboarding & CRM WhatsApp (Ativação de Lojistas)")
@Controller("onboarding")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get("pipeline")
  @ApiOperation({
    summary: "Retorna todas as empresas em Trial categorizadas por estágio da régua (D0 a D7)",
  })
  @ApiResponse({ status: 200, description: "Pipeline retornado com sucesso." })
  getPipeline() {
    return this.onboardingService.getPipeline();
  }

  @Get("config")
  @ApiOperation({
    summary: "Consulta configurações de envio de WhatsApp (Evolution API / Webhook)",
  })
  getConfig() {
    return this.onboardingService.getConfig();
  }

  @Post("config")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Atualiza as configurações de webhook ou Evolution API",
  })
  updateConfig(@Body() dto: UpdateOnboardingConfigDto) {
    return this.onboardingService.updateConfig(dto);
  }

  @Post("dispatch")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Dispara manualmente a mensagem de um estágio da régua para o lojista",
  })
  @ApiResponse({ status: 200, description: "Mensagem disparada com sucesso." })
  dispatchStageMessage(@Body() dto: DispatchOnboardingMessageDto) {
    return this.onboardingService.dispatchStageMessage(dto);
  }
}
