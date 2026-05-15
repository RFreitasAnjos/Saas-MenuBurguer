import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayOrders, monthOrders, topProducts, statusCounts] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: {
            tenantId,
            paymentStatus: PaymentStatus.PAID,
            createdAt: { gte: today, lt: tomorrow },
            deletedAt: null,
          },
          _sum: { total: true },
          _count: true,
        }),

        this.prisma.order.aggregate({
          where: {
            tenantId,
            paymentStatus: PaymentStatus.PAID,
            createdAt: { gte: startOfMonth },
            deletedAt: null,
          },
          _sum: { total: true },
          _count: true,
          _avg: { total: true },
        }),

        this.prisma.orderItem.groupBy({
          by: ['productId'],
          where: { order: { tenantId, deletedAt: null } },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),

        this.prisma.order.groupBy({
          by: ['status'],
          where: { tenantId, deletedAt: null },
          _count: true,
        }),
      ]);

    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, image: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return {
      today: {
        revenue: todayOrders._sum.total ?? 0,
        orders: todayOrders._count,
      },
      month: {
        revenue: monthOrders._sum.total ?? 0,
        orders: monthOrders._count,
        averageTicket: monthOrders._avg.total ?? 0,
      },
      topProducts: topProducts.map((p) => ({
        product: productMap.get(p.productId),
        quantity: p._sum.quantity ?? 0,
      })),
      ordersByStatus: statusCounts.reduce(
        (acc, cur) => ({ ...acc, [cur.status]: cur._count }),
        {} as Record<OrderStatus, number>,
      ),
    };
  }
}
