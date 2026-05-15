import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'Classic Burguer' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Pão brioche, carne 180g, queijo cheddar' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 29.9 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
