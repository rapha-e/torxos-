import { IsString, IsNotEmpty, IsOptional, IsEmail } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateBranchDto {
  @ApiProperty({ example: "TorxOS Tech — Shopping Sul", description: "Nome Fantasia da Unidade / Filial" })
  @IsString()
  @IsNotEmpty({ message: "O nome fantasia da filial é obrigatório." })
  tradeName: string;

  @ApiPropertyOptional({ example: "TorxOS Manutenções Ltda - Filial 02", description: "Razão Social da Filial" })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiProperty({ example: "12.345.678/0002-99", description: "CNPJ da Filial" })
  @IsString()
  @IsNotEmpty({ message: "O documento/CNPJ da filial é obrigatório." })
  document: string;

  @ApiProperty({ example: "(11) 98888-7777", description: "Telefone ou WhatsApp de atendimento da filial" })
  @IsString()
  @IsNotEmpty({ message: "O telefone da filial é obrigatório." })
  phone: string;

  @ApiProperty({ example: "shoppingsul@torxos.com.br", description: "E-mail de contato da filial" })
  @IsEmail({}, { message: "Forneça um e-mail válido para a filial." })
  email: string;
}
