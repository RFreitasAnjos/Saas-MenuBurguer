import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

interface AuthUser {
  userId: string;
  role: UserRole;
  tenantId: string | null;
}

@ApiTags('Menu — Produtos')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar produto [ADMIN]' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) {
    return this.productsService.create(dto, user.tenantId!);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar produtos do tenant (público)' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'categoryId', required: false })
  findAll(
    @Query('tenantId') tenantId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findAllByTenant(tenantId, categoryId, true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os produtos do tenant [ADMIN]' })
  findAllAdmin(
    @CurrentUser() user: AuthUser,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findAllByTenant(user.tenantId!, categoryId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.update(id, dto, user.tenantId!);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.productsService.remove(id, user.tenantId!);
  }
}
