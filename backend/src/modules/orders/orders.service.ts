import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, OrderType, OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const EMPLOYEE_ALLOWED_TRANSITIONS: Partial<
  Record<OrderStatus, OrderStatus[]>
> = {
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto, userId: string, tenantId: string) {
    if (dto.type === OrderType.LOCAL && !dto.tableNumber) {
      throw new BadRequestException(
        'Número da mesa é obrigatório para pedido local.',
      );
    }
    if (dto.type === OrderType.DELIVERY && !dto.addressId) {
      throw new BadRequestException('Endereço é obrigatório para delivery.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('O pedido deve ter pelo menos um item.');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
        active: true,
        deletedAt: null,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'Um ou mais produtos não encontrados ou indisponíveis.',
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const itemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.price);
      const total = unitPrice * item.quantity;
      subtotal += total;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total,
        notes: item.notes,
      };
    });

    const deliveryFee = dto.type === OrderType.DELIVERY ? 5 : 0;
    const total = subtotal + deliveryFee;

    return this.prisma.order.create({
      data: {
        tenantId,
        userId,
        type: dto.type,
        tableNumber: dto.tableNumber,
        addressId: dto.addressId,
        notes: dto.notes,
        subtotal,
        deliveryFee,
        total,
        items: { create: itemsData },
      },
      include: { items: { include: { product: true } }, address: true },
    });
  }

  findAllByTenant(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
        address: true,
      },
    });
  }

  findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, image: true } },
          },
        },
        payments: true,
      },
    });
  }

  async findOne(id: string, tenantId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: { include: { product: true } },
        address: true,
        payments: true,
      },
    });

    if (!order || order.deletedAt)
      throw new NotFoundException('Pedido não encontrado.');
    if (tenantId && order.tenantId !== tenantId)
      throw new NotFoundException('Pedido não encontrado.');

    return order;
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    userRole: UserRole,
    tenantId: string,
  ) {
    const order = await this.findOne(id, tenantId);

    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      return this.prisma.order.update({
        where: { id },
        data: { status: dto.status },
      });
    }

    if (userRole === UserRole.EMPLOYEE) {
      const allowed = EMPLOYEE_ALLOWED_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new ForbiddenException(
          `Não é permitido mudar o status de ${order.status} para ${dto.status}.`,
        );
      }
      return this.prisma.order.update({
        where: { id },
        data: { status: dto.status },
      });
    }

    if (userRole === UserRole.CUSTOMER) {
      if (order.status !== OrderStatus.PENDING) {
        throw new ForbiddenException(
          'Pedido já está em processamento e não pode ser cancelado.',
        );
      }
      if (dto.status !== OrderStatus.CANCELLED) {
        throw new ForbiddenException(
          'Clientes só podem cancelar pedidos pendentes.',
        );
      }
      return this.prisma.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });
    }

    throw new ForbiddenException('Acesso negado.');
  }
}
