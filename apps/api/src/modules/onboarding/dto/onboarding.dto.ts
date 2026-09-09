import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum, IsUrl } from "class-validator";

export enum OnboardingStage {
  D0_WELCOME = "D0_WELCOME",
  D1_FIRST_OS = "D1_FIRST_OS",
  D3_WHATSAPP_STATUS = "D3_WHATSAPP_STATUS",
  D5_TRIAL_EXPIRING = "D5_TRIAL_EXPIRING",
  D7_CONVERSION = "D7_CONVERSION",
}

export class DispatchOnboardingMessageDto {
  @ApiProperty({
    description: "ID da empresa (Tenant)",
    example: "tenant_123",
  })
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: "Estágio da mensagem na régua de onboarding",
    enum: OnboardingStage,
    default: OnboardingStage.D0_WELCOME,
  })
  @IsEnum(OnboardingStage)
  stage: OnboardingStage;

  @ApiProperty({
    description: "Mensagem customizada opcional para substituir o template padrão",
    required: false,
  })
  @IsString()
  @IsOptional()
  customMessage?: string;
}

export class UpdateOnboardingConfigDto {
  @ApiProperty({
    description: "URL do webhook externo (n8n, Make, Zapier) para envio de WhatsApp",
    example: "https://n8n.seuservidor.com/webhook/torxos-whatsapp",
    required: false,
  })
  @IsUrl()
  @IsOptional()
  webhookUrl?: string;

  @ApiProperty({
    description: "URL base da Evolution API ou Z-API",
    example: "https://api.evolution.seuservidor.com",
    required: false,
  })
  @IsString()
  @IsOptional()
  apiUrl?: string;

  @ApiProperty({
    description: "Token / API Key da Evolution API",
    required: false,
  })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiProperty({
    description: "Nome da instância na Evolution API",
    example: "torxos_master",
    required: false,
  })
  @IsString()
  @IsOptional()
  instanceName?: string;
}
