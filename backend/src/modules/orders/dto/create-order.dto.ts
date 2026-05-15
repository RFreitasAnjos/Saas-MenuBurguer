import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsInt,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderType } from '@prisma/client';

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiPropertyOptional({
    description: 'Número da mesa — obrigatório se type=LOCAL',
  })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiPropertyOptional({
    description: 'ID do endereço — obrigatório se type=DELIVERY',
  })
  @IsOptional()
  @IsString()
  addressId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
