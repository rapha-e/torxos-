import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateSaleItemDto {
  @ApiProperty({ description: "ID do produto cadastrado no estoque", example: "uuid-do-produto" })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: "IMEI ou Serial do aparelho (obrigatório para celulares)", example: "356789123456789" })
  @IsString()
  @IsOptional()
  imeiOrSerial?: string;

  @ApiProperty({ description: "Quantidade de unidades vendidas", example: 1 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: "Preço unitário de venda praticado", example: 89.90 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: "Desconto aplicado neste item", example: 0.00 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional({ description: "ID do cliente (se cadastrado)", example: "uuid-do-cliente" })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: "ID do vendedor/atendente", example: "uuid-do-usuario" })
  @IsString()
  @IsOptional()
  sellerId?: string;

  @ApiProperty({
    description: "Método de pagamento",
    enum: ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "MULTIPLE"],
    example: "PIX",
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({ description: "Valor entregue em dinheiro para cálculo de troco", example: 100.00 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  receivedAmount?: number;

  @ApiPropertyOptional({ description: "Desconto global na venda", example: 0.00 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: "Observações da venda", example: "Venda rápida balcão - garantia de 90 dias" })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: "Itens vendidos", type: [CreateSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
