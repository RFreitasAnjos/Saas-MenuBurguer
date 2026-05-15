import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Hambúrgueres' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'hamburgueres' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens.',
  })
  slug: string;

  @ApiPropertyOptional({ example: '🍔' })
  @IsOptional()
  @IsString()
  icon?: string;

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
