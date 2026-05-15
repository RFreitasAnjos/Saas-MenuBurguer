import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto, tenantId: string) {
    return this.prisma.product.create({
      data: { ...dto, tenantId },
    });
  }

  findAllByTenant(tenantId: string, categoryId?: string, onlyActive = false) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(categoryId && { categoryId }),
        ...(onlyActive && { active: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
  }

  async findOne(id: string, tenantId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product || product.deletedAt)
      throw new NotFoundException('Produto não encontrado.');
    if (tenantId && product.tenantId !== tenantId)
      throw new NotFoundException('Produto não encontrado.');

    return product;
  }

  async update(id: string, dto: UpdateProductDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
