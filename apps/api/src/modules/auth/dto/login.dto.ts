import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "gestor@torxos.com.br", description: "E-mail do usuário" })
  @IsEmail({}, { message: "Informe um e-mail válido" })
  email: string;

  @ApiProperty({ example: "senha123", description: "Senha de acesso", minLength: 6 })
  @IsString()
  @MinLength(6, { message: "A senha deve ter no mínimo 6 caracteres" })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: "Refresh token para renovação de sessão" })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
