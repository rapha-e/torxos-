import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEmail } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateTenantSettingsDto {
  @ApiPropertyOptional({ example: "TorxOS Tech Center - Matriz" })
  @IsOptional()
  @IsString()
  tradeName?: string;

  @ApiPropertyOptional({ example: "TorxOS Soluções em Manutenção LTDA" })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ example: "(11) 98888-7766" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "contato@torxos.com.br" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "https://... ou data:image/png;base64,..." })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 90, description: "Dias de garantia padrão" })
  @IsOptional()
  @IsNumber()
  warrantyDaysDefault?: number;

  @ApiPropertyOptional({ example: "Termos formais de garantia legal de 90 dias conforme CDC..." })
  @IsOptional()
  @IsString()
  warrantyTermsText?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableWhatsappAuto?: boolean;
}

export class CreateTeamUserDto {
  @ApiProperty({ example: "Pedro Assistente Técnico" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "pedro.tecnico@torxos.com.br" })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: "senha123" })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: "TECHNICIAN" })
  @IsString()
  role: string;

  @ApiPropertyOptional({ example: 15.0, description: "% Comissão em Serviços" })
  @IsOptional()
  @IsNumber()
  commissionServicesPercent?: number;

  @ApiPropertyOptional({ example: 5.0, description: "% Comissão em Peças" })
  @IsOptional()
  @IsNumber()
  commissionProductsPercent?: number;
}
