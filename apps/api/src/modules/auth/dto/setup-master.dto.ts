import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SetupMasterDto {
  @ApiProperty({ example: "Raphael Dono do Software", description: "Nome do Dono do Software" })
  @IsString()
  @IsNotEmpty({ message: "O nome é obrigatório" })
  name: string;

  @ApiProperty({ example: "dono@torxos.tech", description: "E-mail do Dono do Software" })
  @IsEmail({}, { message: "Informe um e-mail válido" })
  email: string;

  @ApiProperty({ example: "senhaSegura123", description: "Senha mestra de acesso", minLength: 6 })
  @IsString()
  @MinLength(6, { message: "A senha deve ter no mínimo 6 caracteres" })
  password: string;

  @ApiPropertyOptional({ description: "Chave de autorização (necessária apenas caso já exista outro Super Admin)" })
  @IsString()
  @IsOptional()
  setupSecret?: string;
}
