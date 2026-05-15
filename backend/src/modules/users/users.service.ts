import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  tenantId: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 12;

  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateUserDto,
    creatorRole: UserRole,
    creatorTenantId: string | null,
  ) {
    if (
      dto.role === UserRole.SUPER_ADMIN &&
      creatorRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Apenas SUPER_ADMIN pode criar SUPER_ADMIN.',
      );
    }

    const tenantId = dto.tenantId ?? creatorTenantId;

    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId },
    });

    if (existing) throw new ConflictException('E-mail já cadastrado.');

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
        tenantId,
      },
      select: USER_SELECT,
    });
  }

  findAllByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: USER_SELECT,
    });
  }

  async findOne(id: string, tenantId?: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: { ...USER_SELECT, tenantId: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado.');

    if (tenantId !== undefined && user.tenantId !== tenantId) {
      throw new ForbiddenException('Acesso negado.');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, tenantId?: string | null) {
    await this.findOne(id, tenantId);

    const data: Record<string, unknown> = { ...dto };

    if (dto.password) {
      data['password'] = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async remove(id: string, tenantId?: string | null) {
    await this.findOne(id, tenantId);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: USER_SELECT,
    });
  }
}
