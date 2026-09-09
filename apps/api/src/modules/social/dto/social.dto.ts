import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsUrl } from "class-validator";

export enum SocialPillar {
  BANCADA_TECNICA = "BANCADA_TECNICA",
  GESTAO_OFICINA = "GESTAO_OFICINA",
  ATENDIMENTO_CLIENTE = "ATENDIMENTO_CLIENTE",
  PRODUTIVIDADE_SISTEMA = "PRODUTIVIDADE_SISTEMA",
}

export enum SocialFormat {
  CAROUSEL = "CAROUSEL",
  SINGLE_IMAGE = "SINGLE_IMAGE",
  REELS_SCRIPT = "REELS_SCRIPT",
}

export enum SocialTone {
  DIRETO_E_PRATICO = "DIRETO_E_PRATICO",
  MENTOR_PROFISSIONAL = "MENTOR_PROFISSIONAL",
  PROVOCATIVO = "PROVOCATIVO",
}

export class GenerateCarouselDto {
  @ApiProperty({
    description: "Pilar de conteúdo a ser abordado no carrossel",
    enum: SocialPillar,
    default: SocialPillar.GESTAO_OFICINA,
  })
  @IsEnum(SocialPillar)
  @IsOptional()
  pillar?: SocialPillar = SocialPillar.GESTAO_OFICINA;

  @ApiProperty({
    description: "Tema específico ou tópico customizado",
    example: "Como precificar troca de tela de iPhone sem tomar prejuízo",
    required: false,
  })
  @IsString()
  @IsOptional()
  customTopic?: string;

  @ApiProperty({
    description: "Quantidade de slides (entre 4 e 8)",
    default: 6,
    minimum: 4,
    maximum: 8,
  })
  @IsNumber()
  @Min(4)
  @Max(8)
  @IsOptional()
  totalSlides?: number = 6;

  @ApiProperty({
    description: "Tom da comunicação do carrossel",
    enum: SocialTone,
    default: SocialTone.DIRETO_E_PRATICO,
  })
  @IsEnum(SocialTone)
  @IsOptional()
  tone?: SocialTone = SocialTone.DIRETO_E_PRATICO;
}

export class GenerateWeeklyPackDto {
  @ApiProperty({
    description: "Tema geral da semana",
    example: "Semana da Lucratividade na Assistência Técnica",
    required: false,
  })
  @IsString()
  @IsOptional()
  weeklyTheme?: string;

  @ApiProperty({
    description: "Quantidade de posts da semana (padrão: 3 posts - Seg/Qua/Sex)",
    default: 3,
    minimum: 1,
    maximum: 7,
  })
  @IsNumber()
  @Min(1)
  @Max(7)
  @IsOptional()
  postsCount?: number = 3;
}

export class PublishWebhookDto {
  @ApiProperty({
    description: "URL de webhook do n8n, Make, Buffer ou Zapier",
    example: "https://n8n.seuservidor.com/webhook/instagram-torxos",
  })
  @IsUrl()
  webhookUrl: string;

  @ApiProperty({
    description: "Objeto do post a ser publicado ou agendado",
  })
  postData: any;

  @ApiProperty({
    description: "Canal de destino",
    example: "INSTAGRAM",
    required: false,
  })
  @IsString()
  @IsOptional()
  channel?: string = "INSTAGRAM";
}
