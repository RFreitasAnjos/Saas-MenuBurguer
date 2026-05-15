import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface AuthUser {
  userId: string;
}

@ApiTags('Delivery — Endereços')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar endereço' })
  create(@Body() dto: CreateAddressDto, @CurrentUser() user: AuthUser) {
    return this.deliveryService.createAddress(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar meus endereços' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.deliveryService.findAddressesByUser(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.deliveryService.findAddress(id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveryService.updateAddress(id, dto, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.deliveryService.removeAddress(id, user.userId);
  }
}
