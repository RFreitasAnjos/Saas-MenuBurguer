import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto, tenantId: string) {
    const existing = await this.prisma.category.findUnique({
      where: { tenantId_slug: { tenantId, slug: dto.slug } },
    });
    if (existing)
      throw new ConflictException('Slug já existe neste restaurante.');

    return this.prisma.category.create({ data: { ...dto, tenantId } });
  }

  findAllByTenant(tenantId: string, onlyActive = false) {
    return this.prisma.category.findMany({
      where: { tenantId, deletedAt: null, ...(onlyActive && { active: true }) },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(id: string, tenantId?: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category || category.deletedAt)
      throw new NotFoundException('Categoria não encontrada.');
    if (tenantId && category.tenantId !== tenantId)
      throw new NotFoundException('Categoria não encontrada.');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, tenantId: string) {
    await this.findOne(id, tenantId);

    if (dto.slug) {
      const conflict = await this.prisma.category.findFirst({
        where: { tenantId, slug: dto.slug, NOT: { id } },
      });
      if (conflict)
        throw new ConflictException('Slug já existe neste restaurante.');
    }

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
