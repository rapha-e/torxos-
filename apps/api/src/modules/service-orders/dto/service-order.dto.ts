import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsArray, ValidateNested, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OsStatus } from "../../../common/enums";

export class CreateServiceOrderItemDto {
  @ApiProperty({ example: "SERVICE", enum: ["SERVICE", "PRODUCT"] })
  @IsString()
  @IsNotEmpty()
  itemType: "SERVICE" | "PRODUCT";

  @ApiPropertyOptional({ description: "ID do Produto no estoque (caso seja PRODUCT)" })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ example: "Troca de Tela Frontal iPhone 13 Pro" })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 350.0 })
  @IsNumber()
  unitCost: number;

  @ApiProperty({ example: 890.0 })
  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({ description: "ID do Técnico executor para comissão" })
  @IsOptional()
  @IsUUID()
  technicianId?: string;
}

export class CreateServiceOrderDto {
  @ApiProperty({ description: "ID do Cliente" })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ description: "Nome do Cliente (para fallback/cadastro rápido)" })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ description: "Telefone do Cliente (para fallback/cadastro rápido)" })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @ApiPropertyOptional({ description: "ID do Técnico responsável" })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional({ example: "NORMAL", enum: ["LOW", "NORMAL", "URGENT"] })
  @IsOptional()
  @IsString()
  priority?: "LOW" | "NORMAL" | "URGENT";

  @ApiProperty({ example: "Smartphone" })
  @IsString()
  @IsNotEmpty()
  deviceType: string;

  @ApiProperty({ example: "Apple" })
  @IsString()
  @IsNotEmpty()
  deviceBrand: string;

  @ApiProperty({ example: "iPhone 13 Pro Max" })
  @IsString()
  @IsNotEmpty()
  deviceModel: string;

  @ApiPropertyOptional({ example: "358921092837123" })
  @IsOptional()
  @IsString()
  serialOrImei?: string;

  @ApiPropertyOptional({ example: "123456" })
  @IsOptional()
  @IsString()
  devicePassword?: string;

  @ApiProperty({ example: "Aparelho não liga após queda em água doce" })
  @IsString()
  @IsNotEmpty()
  reportedDefect: string;

  @ApiPropertyOptional({ description: "Checklist de entrada com avarias e estado" })
  @IsOptional()
  entryChecklist?: any;

  @ApiPropertyOptional({ type: [CreateServiceOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceOrderItemDto)
  items?: CreateServiceOrderItemDto[];
}

export class UpdateOsStatusDto {
  @ApiProperty({ enum: OsStatus, example: "APPROVED" })
  @IsEnum(OsStatus)
  status: OsStatus;

  @ApiPropertyOptional({ example: "PIX", description: "Forma de pagamento (caso status seja DELIVERED)" })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: "Observações ou diagnóstico técnico" })
  @IsOptional()
  @IsString()
  technicalDiagnosis?: string;
}

export class ClientApproveDto {
  @ApiPropertyOptional({ example: "189.12.33.45" })
  @IsOptional()
  @IsString()
  clientIp?: string;

  @ApiPropertyOptional({ example: "-23.5505, -46.6333" })
  @IsOptional()
  @IsString()
  geolocation?: string;

  @ApiPropertyOptional({ description: "URL da assinatura capturada em canvas" })
  @IsOptional()
  @IsString()
  signatureDataUrl?: string;
}
