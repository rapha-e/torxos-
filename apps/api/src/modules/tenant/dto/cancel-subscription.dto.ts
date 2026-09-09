import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum } from "class-validator";

export enum CancellationReason {
  PRECO = "PRECO",
  FALTA_TEMPO = "FALTA_TEMPO",
  FECHAMENTO_LOJA = "FECHAMENTO_LOJA",
  FALTA_RECURSOS = "FALTA_RECURSOS",
  DIFICULDADE_USO = "DIFICULDADE_USO",
  OUTRO = "OUTRO",
}

export class CancelSubscriptionDto {
  @ApiProperty({
    description: "Motivo principal pelo qual a empresa está cancelando a assinatura",
    enum: CancellationReason,
    default: CancellationReason.PRECO,
  })
  @IsEnum(CancellationReason)
  reason: CancellationReason;

  @ApiProperty({
    description: "Feedback opcional ou sugestões de melhoria para o TorxOS",
    required: false,
    example: "Gostaria de ter suporte a impressão em outro modelo de bobina...",
  })
  @IsString()
  @IsOptional()
  feedback?: string;
}
