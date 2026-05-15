import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface AuthUser {
  userId: string;
  role: UserRole;
  tenantId: string | null;
}

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar pedido [CUSTOMER]' })
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
    return this.ordersService.create(dto, user.userId, user.tenantId!);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('tenant')
  @ApiOperation({ summary: 'Listar pedidos do tenant [ADMIN/EMPLOYEE]' })
  findAllByTenant(@CurrentUser() user: AuthUser) {
    return this.ordersService.findAllByTenant(user.tenantId!);
  }

  @Get('my')
  @ApiOperation({ summary: 'Meus pedidos [CUSTOMER]' })
  findMyOrders(@CurrentUser() user: AuthUser) {
    return this.ordersService.findMyOrders(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.findOne(id, user.tenantId ?? undefined);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do pedido' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.updateStatus(id, dto, user.role, user.tenantId!);
  }
}
