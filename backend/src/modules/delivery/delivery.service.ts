import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async createAddress(dto: CreateAddressDto, userId: string) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, deletedAt: null },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({ data: { ...dto, userId } });
  }

  findAddressesByUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findAddress(id: string, userId: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address || address.deletedAt)
      throw new NotFoundException('Endereço não encontrado.');
    if (address.userId !== userId)
      throw new ForbiddenException('Acesso negado.');
    return address;
  }

  async updateAddress(id: string, dto: UpdateAddressDto, userId: string) {
    await this.findAddress(id, userId);

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, deletedAt: null, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async removeAddress(id: string, userId: string) {
    await this.findAddress(id, userId);
    return this.prisma.address.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
