import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterTenantDto {
  @ApiProperty({ example: "SmartFix Assistência Técnica", description: "Nome Fantasia da Loja" })
  @IsString()
  @IsNotEmpty({ message: "Nome da empresa é obrigatório" })
  tradeName: string;

  @ApiProperty({ example: "SmartFix Reparos e Eletrônicos LTDA", description: "Razão Social", required: false })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiProperty({ example: "45.123.456/0001-88", description: "CNPJ ou CPF da Empresa" })
  @IsString()
  @IsNotEmpty({ message: "CNPJ ou CPF é obrigatório" })
  document: string;

  @ApiProperty({ example: "(11) 99999-8888", description: "WhatsApp ou Telefone Comercial" })
  @IsString()
  @IsNotEmpty({ message: "Telefone de contato é obrigatório" })
  phone: string;

  @ApiProperty({ example: "Carlos Oliveira", description: "Nome completo do Gestor/Dono" })
  @IsString()
  @IsNotEmpty({ message: "Nome do gestor é obrigatório" })
  name: string;

  @ApiProperty({ example: "contato@smartfix.com.br", description: "E-mail de acesso" })
  @IsEmail({}, { message: "Informe um e-mail válido" })
  email: string;

  @ApiProperty({ example: "senhaSegura123", description: "Senha de acesso", minLength: 6 })
  @IsString()
  @MinLength(6, { message: "A senha deve ter no mínimo 6 caracteres" })
  password: string;

  @ApiProperty({ example: "PRO", description: "Plano escolhido: STARTER, PRO ou ENTERPRISE", required: false })
  @IsString()
  @IsOptional()
  plan?: string;
}
