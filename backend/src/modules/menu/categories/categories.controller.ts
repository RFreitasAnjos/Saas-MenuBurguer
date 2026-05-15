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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TenantId } from '../../../common/decorators/tenant-id.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

interface AuthUser {
  userId: string;
  role: UserRole;
  tenantId: string | null;
}

@ApiTags('Menu — Categorias')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar categoria [ADMIN]' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthUser) {
    return this.categoriesService.create(dto, user.tenantId!);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar categorias (público)' })
  @ApiQuery({ name: 'tenantId', required: true })
  findAll(@Query('tenantId') tenantId: string) {
    return this.categoriesService.findAllByTenant(tenantId, true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as categorias do tenant [ADMIN]' })
  findAllAdmin(@CurrentUser() user: AuthUser) {
    return this.categoriesService.findAllByTenant(user.tenantId!);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.categoriesService.update(id, dto, user.tenantId!);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.categoriesService.remove(id, user.tenantId!);
  }
}
