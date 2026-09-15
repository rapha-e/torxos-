import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength, IsOptional, IsEmail } from "class-validator";

export class CancelSaleDto {
  @ApiProperty({
    description: "Motivo ou justificativa obrigatória do cancelamento da venda",
    example: "Cliente desistiu da compra / Produto devolvido no balcão",
  })
  @IsNotEmpty({ message: "O motivo do cancelamento é obrigatório." })
  @IsString()
  @MinLength(3, { message: "O motivo do cancelamento deve ter pelo menos 3 caracteres." })
  reason: string;

  @ApiPropertyOptional({
    description: "E-mail do administrador que autoriza o cancelamento (obrigatório caso o usuário conectado não seja ADMIN)",
    example: "admin@loja.com.br",
  })
  @IsOptional()
  @IsEmail({}, { message: "E-mail do administrador deve ser um e-mail válido." })
  adminEmail?: string;

  @ApiProperty({
    description: "Senha do administrador para autorização formal do estorno",
    example: "admin123",
  })
  @IsNotEmpty({ message: "A senha do administrador é obrigatória para autorização." })
  @IsString()
  adminPassword: string;
}
