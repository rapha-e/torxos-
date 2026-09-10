import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsNumber, IsString } from "class-validator";

export class OptimizeImageDto {
  @ApiProperty({
    description: "Imagem em formato Base64 ou Data URL (ex: data:image/jpeg;base64,...)",
    example: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  })
  @IsNotEmpty({ message: "O campo dataUrl ou base64 é obrigatório." })
  @IsString()
  dataUrl: string;

  @ApiPropertyOptional({
    description: "Largura máxima da imagem em pixels (padrão 1920px)",
    default: 1920,
  })
  @IsOptional()
  @IsNumber()
  maxWidth?: number;

  @ApiPropertyOptional({
    description: "Qualidade da compressão WebP de 1 a 100 (padrão 80)",
    default: 80,
  })
  @IsOptional()
  @IsNumber()
  quality?: number;
}
