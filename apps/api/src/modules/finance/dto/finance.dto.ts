import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsNumber, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TransactionType, TransactionStatus } from "../../../common/enums";

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType, example: "RECEIVABLE" })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiPropertyOptional({ description: "ID da Conta no Plano de Contas" })
  @IsOptional()
  @IsString()
  chartOfAccountId?: string;

  @ApiPropertyOptional({ description: "ID da Conta Bancária / Caixa de liquidação" })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: "ID do Cliente associado" })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: "ID da Ordem de Serviço associada" })
  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @ApiProperty({ example: "Venda de Acessórios Balcão" })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 450.0 })
  @IsNumber()
  grossAmount: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsOptional()
  @IsNumber()
  feeAmount?: number;

  @ApiProperty({ example: "2026-09-04", description: "Data de competência (DRE)" })
  @IsDateString()
  competenceDate: string;

  @ApiProperty({ example: "2026-09-10", description: "Data de vencimento" })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: "PIX", description: "Método de pagamento" })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class SettleTransactionDto {
  @ApiProperty({ description: "ID da Conta Bancária que recebeu/pagou" })
  @IsUUID()
  bankAccountId: string;

  @ApiPropertyOptional({ example: 0.0 })
  @IsOptional()
  @IsNumber()
  interestAmount?: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({ example: "2026-09-04" })
  @IsOptional()
  @IsDateString()
  settlementDate?: string;
}
