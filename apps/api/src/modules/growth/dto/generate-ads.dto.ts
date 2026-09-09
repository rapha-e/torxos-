import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from "class-validator";

export enum AdsFocusTopic {
  GERAL = "GERAL",
  ESTOQUE = "ESTOQUE",
  OS_WHATSAPP = "OS_WHATSAPP",
  FINANCEIRO_DRE = "FINANCEIRO_DRE",
  AI_MENTOR = "AI_MENTOR",
}

export enum AdsChannel {
  ALL = "ALL",
  META_ADS = "META_ADS",
  GOOGLE_ADS = "GOOGLE_ADS",
}

export enum CopyFramework {
  ALL = "ALL",
  PAS = "PAS", // Problem - Agitation - Solution
  AIDA = "AIDA", // Attention - Interest - Desire - Action
  DIRECT_RESPONSE = "DIRECT_RESPONSE", // Gancho de impacto + Oferta 7 dias
}

export class GenerateAdsDto {
  @ApiProperty({
    description: "Tema principal ou dor de bancada a ser abordada nos anúncios",
    enum: AdsFocusTopic,
    default: AdsFocusTopic.GERAL,
  })
  @IsEnum(AdsFocusTopic)
  @IsOptional()
  focus?: AdsFocusTopic = AdsFocusTopic.GERAL;

  @ApiProperty({
    description: "Canal de tráfego pago desejado",
    enum: AdsChannel,
    default: AdsChannel.ALL,
  })
  @IsEnum(AdsChannel)
  @IsOptional()
  channel?: AdsChannel = AdsChannel.ALL;

  @ApiProperty({
    description: "Framework de copywriting persuasivo",
    enum: CopyFramework,
    default: CopyFramework.ALL,
  })
  @IsEnum(CopyFramework)
  @IsOptional()
  framework?: CopyFramework = CopyFramework.ALL;

  @ApiProperty({
    description: "Quantidade de variações a gerar",
    default: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  count?: number = 3;

  @ApiProperty({
    description: "Instruções ou ganchos adicionais personalizados",
    required: false,
  })
  @IsString()
  @IsOptional()
  customInstructions?: string;
}

export class GeneratePayloadDto {
  @ApiProperty({ description: "ID da Conta de Anúncios no Meta (ex: act_123456789)" })
  @IsString()
  adAccountId: string;

  @ApiProperty({ description: "ID do Pixel do Facebook", required: false })
  @IsString()
  @IsOptional()
  pixelId?: string;

  @ApiProperty({ description: "Orçamento diário em reais (ex: 30.00)", default: 30.0 })
  @IsNumber()
  @IsOptional()
  dailyBudget?: number = 30.0;

  @ApiProperty({ description: "URL de destino", default: "https://app.torxos.com.br/lp" })
  @IsString()
  @IsOptional()
  destinationUrl?: string = "https://app.torxos.com.br/lp";
}
