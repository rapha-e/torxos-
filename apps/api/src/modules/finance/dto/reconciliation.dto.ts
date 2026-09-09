import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsUUID, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ParseOfxDto {
  @ApiProperty({ description: "Conteúdo do arquivo OFX em texto bruto" })
  @IsString()
  @IsNotEmpty()
  ofxContent: string;
}

export enum ReconciliationAction {
  MATCH = "MATCH",             // Vincula a um título existente e quita
  CREATE_NEW = "CREATE_NEW",   // Cria uma nova transação já quitada (ex: tarifa, despesa não cadastrada)
  IGNORE = "IGNORE",           // Ignora a transação
}

export class ReconcileItemDto {
  @ApiProperty({ example: "20260904001" })
  @IsString()
  fitId: string;

  @ApiProperty({ enum: ReconciliationAction, example: "MATCH" })
  @IsEnum(ReconciliationAction)
  action: ReconciliationAction;

  @ApiProperty({ description: "ID da Conta Bancária vinculada" })
  @IsUUID()
  bankAccountId: string;

  @ApiPropertyOptional({ description: "ID do título financeiro existente (caso MATCH)" })
  @IsOptional()
  @IsUUID()
  matchedTransactionId?: string;

  @ApiPropertyOptional({ description: "ID do plano de contas para nova transação (caso CREATE_NEW)" })
  @IsOptional()
  @IsUUID()
  chartOfAccountId?: string;

  @ApiPropertyOptional({ description: "Descrição personalizada para nova transação" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ConfirmReconciliationDto {
  @ApiProperty({ type: [ReconcileItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReconcileItemDto)
  items: ReconcileItemDto[];
}
