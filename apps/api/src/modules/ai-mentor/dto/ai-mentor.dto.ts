import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum AiMentorPillar {
  REVENUE = "REVENUE",       // 1. Aumentar Faturamento
  PROFIT = "PROFIT",         // 2. Entender Seu Lucro
  ROUTINE = "ROUTINE",       // 3. Organização da Rotina
  FINANCE = "FINANCE",       // 4. Gestão Financeira
  MARKETING = "MARKETING",   // 5. Atendimento e Marketing
}

export class ConsultMentorDto {
  @ApiProperty({ enum: AiMentorPillar, example: "REVENUE" })
  @IsEnum(AiMentorPillar)
  pillar: AiMentorPillar;

  @ApiProperty({ example: "Como posso reativar clientes antigos e elevar meu faturamento neste mês?" })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export class GenerateQuoteCopyDto {
  @ApiProperty({ description: "ID da Ordem de Serviço para gerar copy personalizada de WhatsApp" })
  @IsString()
  @IsNotEmpty()
  serviceOrderId: string;

  @ApiPropertyOptional({ example: "Cliente está achando o preço um pouco alto" })
  @IsOptional()
  @IsString()
  customerObjection?: string;
}
